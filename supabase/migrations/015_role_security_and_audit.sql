-- Migration: 015_role_security_and_audit
-- Purpose: Set up role audits, profile column protection trigger, and secure assign/promote routines.
-- Assumptions: app_role enum has been updated with 'review_admin'.
-- Transactional: Yes.
-- Dependencies: 014_add_review_admin_role.sql
-- Expected Production Impact: Secures role management, locks profiles table write access, and activates audit trails.

-- 0. Safely alter ad_campaigns constraint to include 'rejected' status
ALTER TABLE public.ad_campaigns DROP CONSTRAINT IF EXISTS ad_campaigns_status_check;
ALTER TABLE public.ad_campaigns ADD CONSTRAINT ad_campaigns_status_check CHECK (status IN ('draft', 'pending', 'active', 'paused', 'expired', 'rejected'));

-- 1. Create role_audit table
CREATE TABLE IF NOT EXISTS public.role_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    target_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    previous_role public.app_role NOT NULL,
    new_role public.app_role NOT NULL,
    changed_by_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    changed_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index audit records for performance
CREATE INDEX IF NOT EXISTS idx_role_audit_target ON public.role_audit(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_date ON public.role_audit(changed_at);

-- Enable RLS on role_audit
ALTER TABLE public.role_audit ENABLE ROW LEVEL SECURITY;

-- Deny all access to anon
-- Allow SELECT for super_admin only
DROP POLICY IF EXISTS select_role_audit_super_admin ON public.role_audit;
CREATE POLICY select_role_audit_super_admin ON public.role_audit
    FOR SELECT
    TO authenticated
    USING (
        (SELECT app_role FROM public.profiles WHERE user_id = auth.uid()) = 'super_admin'::app_role
    );


-- 2. Profiles Column Protection Trigger
-- Prevent anon and authenticated clients from modifying: id, user_id, email, app_role, created_at.
-- Admins and standard members are restricted from direct UPDATE on these fields.
CREATE OR REPLACE FUNCTION public.check_profile_immutable_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Block direct modification of app_role from standard clients
  -- (Must use public.assign_user_role or public.promote_to_business_owner)
  IF NEW.app_role IS DISTINCT FROM OLD.app_role THEN
    IF current_setting('public.allow_role_change', true) IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'Privilege Escalation Blocked: Cannot modify app_role directly.';
    END IF;
  END IF;

  -- user_id, id, email, created_at are immutable for EVERYONE
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Cannot modify user_id';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Cannot modify id';
  END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Cannot modify email';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Cannot modify created_at';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_profile_immutable_fields ON public.profiles;
CREATE TRIGGER trg_check_profile_immutable_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_profile_immutable_fields();

-- Revoke broad UPDATE on profiles table
REVOKE UPDATE ON public.profiles FROM anon, authenticated, public;

-- Grant column-level UPDATE on approved/editable fields to authenticated users
GRANT UPDATE (
    full_name, phone, club, imis_id, ym_region, ym_district, ym_zone, ym_club, address, city, state, country, education, job_title
) ON public.profiles TO authenticated;

-- Ensure select_profiles RLS policy is updated to include review_admin
DROP POLICY IF EXISTS select_profiles ON public.profiles;
CREATE POLICY select_profiles ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  OR (SELECT app_role FROM public.profiles WHERE user_id = auth.uid()) IN ('super_admin'::app_role, 'review_admin'::app_role)
);


-- 3. public.assign_user_role() function
CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_profile_id uuid,
  requested_role public.app_role
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
declare
  caller_profile_id uuid;
  caller_role public.app_role;
  target_user_id uuid;
  old_role public.app_role;
  super_admin_count int;
begin
  -- Resolve caller profile details
  SELECT id, app_role INTO caller_profile_id, caller_role
  FROM public.profiles
  WHERE user_id = auth.uid();

  -- 1. Caller Authorization Check (must be super_admin)
  if caller_profile_id is null or caller_role <> 'super_admin'::app_role then
    raise exception 'Unauthorized: Administrative credentials required.';
  end if;

  -- 2. Only the four active roles may be assigned. Legacy enum values remain
  -- compatible with existing rows but cannot grant access or be reintroduced.
  if requested_role NOT IN (
    'member'::app_role,
    'business_owner'::app_role,
    'review_admin'::app_role,
    'super_admin'::app_role
  ) then
    raise exception 'Invalid Role: requested role is not an active YMBD role.';
  end if;

  -- 3. Lock target profile row for update and retrieve details
  SELECT user_id, app_role INTO target_user_id, old_role
  FROM public.profiles
  WHERE id = target_profile_id
  FOR UPDATE;

  -- 4. Target Validation
  if target_user_id is null then
    raise exception 'Profile Not Found: The specified target profile does not exist.';
  end if;

  -- 5. Demotion Safety Check: Prevent demoting the final remaining super_admin
  if old_role = 'super_admin'::app_role and requested_role <> 'super_admin'::app_role then
    SELECT count(*)::int INTO super_admin_count
    FROM public.profiles
    WHERE app_role = 'super_admin'::app_role;

    if super_admin_count <= 1 then
      raise exception 'Safety Block: Cannot demote the final remaining super_admin account.';
    end if;
  end if;

  -- 6. Perform Update (bypasses RLS check via SECURITY DEFINER)
  -- Allow role modification in this session
  perform set_config('public.allow_role_change', 'true', true);

  UPDATE public.profiles
  SET app_role = requested_role
  WHERE id = target_profile_id;

  -- 7. Write audit log
  INSERT INTO public.role_audit (target_profile_id, previous_role, new_role, changed_by_profile_id)
  VALUES (target_profile_id, old_role, requested_role, caller_profile_id);

  return 'Role updated successfully to ' || requested_role::text;
end;
$$;

-- Revoke direct execution privileges
REVOKE EXECUTE ON FUNCTION public.assign_user_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_user_role(uuid, public.app_role) TO authenticated;


-- 4. public.promote_to_business_owner() function
CREATE OR REPLACE FUNCTION public.promote_to_business_owner()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
declare
  target_user_id uuid;
  target_profile_id uuid;
  current_role public.app_role;
  owns_business boolean;
begin
  target_user_id := auth.uid();
  if target_user_id is null then
    raise exception 'Authentication required.';
  end if;

  -- Get current user profile and role
  SELECT id, app_role INTO target_profile_id, current_role
  FROM public.profiles
  WHERE user_id = target_user_id;

  if target_profile_id is null then
    raise exception 'Profile not found.';
  end if;

  -- Verify user owns at least one business
  SELECT EXISTS (
    SELECT 1 FROM public.businesses WHERE owner_id = target_user_id
  ) INTO owns_business;

  if not owns_business then
    return 'No change: User does not own any business listing.';
  end if;

  -- Only promote from member -> business_owner
  -- Do not modify any active administrative or ownership role here.
  if current_role = 'member'::app_role then
    -- Allow role modification in this session
    perform set_config('public.allow_role_change', 'true', true);

    -- Update role
    UPDATE public.profiles
    SET app_role = 'business_owner'::app_role
    WHERE id = target_profile_id;

    -- Audit log
    INSERT INTO public.role_audit (target_profile_id, previous_role, new_role, changed_by_profile_id)
    VALUES (target_profile_id, current_role, 'business_owner'::app_role, target_profile_id);

    return 'User promoted to business_owner.';
  end if;

  return 'No change: Current role is ' || current_role::text;
end;
$$;

-- Revoke and grant execute
REVOKE EXECUTE ON FUNCTION public.promote_to_business_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_to_business_owner() TO authenticated;


-- 5. public.moderate_campaign() function
CREATE OR REPLACE FUNCTION public.moderate_campaign(
  campaign_id uuid,
  requested_action text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
declare
  caller_role public.app_role;
  current_status text;
begin
  SELECT app_role INTO caller_role
  FROM public.profiles
  WHERE user_id = auth.uid();

  if caller_role is null or caller_role NOT IN ('super_admin'::app_role, 'review_admin'::app_role) then
    raise exception 'Unauthorized: Reviewer permissions required.';
  end if;

  SELECT status INTO current_status
  FROM public.ad_campaigns
  WHERE id = campaign_id;

  if current_status is null then
    raise exception 'Campaign Not Found.';
  end if;

  if requested_action = 'approve' then
    if current_status <> 'pending' then
      raise exception 'Invalid Transition: Only pending campaigns can be approved.';
    end if;
    UPDATE public.ad_campaigns SET status = 'active' WHERE id = campaign_id;
    return 'Campaign approved and activated.';
  elsif requested_action = 'reject' then
    if current_status <> 'pending' then
      raise exception 'Invalid Transition: Only pending campaigns can be rejected.';
    end if;
    UPDATE public.ad_campaigns SET status = 'rejected' WHERE id = campaign_id;
    return 'Campaign request rejected.';
  elsif requested_action = 'pause' then
    if current_status <> 'active' then
      raise exception 'Invalid Transition: Only active campaigns can be paused.';
    end if;
    UPDATE public.ad_campaigns SET status = 'paused' WHERE id = campaign_id;
    return 'Campaign paused.';
  elsif requested_action = 'resume' then
    if current_status <> 'paused' then
      raise exception 'Invalid Transition: Only paused campaigns can be resumed.';
    end if;
    UPDATE public.ad_campaigns SET status = 'active' WHERE id = campaign_id;
    return 'Campaign resumed.';
  else
    raise exception 'Invalid Action: Actions must be approve, reject, pause, or resume.';
  end if;
end;
$$;

REVOKE EXECUTE ON FUNCTION public.moderate_campaign(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.moderate_campaign(uuid, text) TO authenticated;


-- 6. Revoke direct execute on trigger-only function
REVOKE EXECUTE ON FUNCTION public.check_profile_immutable_fields() FROM PUBLIC, anon, authenticated;
