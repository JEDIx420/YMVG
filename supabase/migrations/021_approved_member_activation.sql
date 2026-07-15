-- Migration: 021_approved_member_activation
-- Purpose: Add the callback activation gate while preserving every existing profile.
-- Dependencies: 020_registration_requests.sql.
-- The legacy auth.users trigger remains in place until migration 022.

ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_approved_at timestamptz;

-- Every profile that exists when this migration is run is an approved legacy account.
UPDATE public.profiles
SET account_approved_at = coalesce(account_approved_at, created_at, timezone('utc'::text, now()))
WHERE account_approved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_normalized_email
  ON public.profiles(lower(btrim(email)));

-- Provisional rows created by the still-present legacy trigger must not acquire
-- effective permissions before approved activation.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT app_role
  FROM public.profiles
  WHERE user_id = auth.uid()
    AND account_approved_at IS NOT NULL;
$$;

CREATE TABLE IF NOT EXISTS public.onboarding_auth_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid,
  normalized_email text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('activated', 'profile_bound', 'login_conflict', 'login_denied')),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  registration_request_id uuid REFERENCES public.registration_requests(id) ON DELETE RESTRICT,
  details text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_onboarding_auth_audit_email
  ON public.onboarding_auth_audit(normalized_email, created_at DESC);

ALTER TABLE public.onboarding_auth_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON public.onboarding_auth_audit FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.onboarding_auth_audit TO authenticated;

DROP POLICY IF EXISTS select_onboarding_auth_audit_reviewers ON public.onboarding_auth_audit;
CREATE POLICY select_onboarding_auth_audit_reviewers
ON public.onboarding_auth_audit
FOR SELECT
TO authenticated
USING (
  (SELECT app_role FROM public.profiles WHERE user_id = auth.uid())
    IN ('review_admin'::public.app_role, 'super_admin'::public.app_role)
);

DROP TRIGGER IF EXISTS trg_onboarding_auth_audit_immutable ON public.onboarding_auth_audit;
CREATE TRIGGER trg_onboarding_auth_audit_immutable
BEFORE UPDATE OR DELETE ON public.onboarding_auth_audit
FOR EACH ROW EXECUTE FUNCTION public.prevent_registration_audit_mutation();

-- Preserve Phase 1 immutability while allowing the activation routine to bind only
-- an unbound profile to the current authenticated user.
CREATE OR REPLACE FUNCTION public.check_profile_immutable_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.app_role IS DISTINCT FROM OLD.app_role
    AND current_setting('public.allow_role_change', true) IS DISTINCT FROM 'true'
  THEN
    RAISE EXCEPTION 'Privilege Escalation Blocked: Cannot modify app_role directly.';
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    IF current_setting('public.allow_profile_binding', true) IS DISTINCT FROM 'true'
      OR OLD.user_id IS NOT NULL
      OR NEW.user_id IS NULL
      OR NEW.user_id IS DISTINCT FROM auth.uid()
    THEN
      RAISE EXCEPTION 'Cannot modify user_id';
    END IF;
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
  IF NEW.account_approved_at IS DISTINCT FROM OLD.account_approved_at
    AND current_setting('public.allow_account_activation', true) IS DISTINCT FROM 'true'
  THEN
    RAISE EXCEPTION 'Cannot modify account approval state';
  END IF;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS select_profiles ON public.profiles;
CREATE POLICY select_profiles ON public.profiles
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id AND account_approved_at IS NOT NULL)
  OR public.get_my_role()
    IN ('super_admin'::public.app_role, 'review_admin'::public.app_role)
);

CREATE OR REPLACE FUNCTION public.activate_approved_member()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_user_id uuid := auth.uid();
  verified_email text;
  clean_email text;
  caller_profile public.profiles%ROWTYPE;
  email_profile public.profiles%ROWTYPE;
  approved_request public.registration_requests%ROWTYPE;
  matching_profile_count integer;
  new_profile_id uuid;
  previous_role public.app_role;
BEGIN
  IF caller_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT u.email INTO verified_email
  FROM auth.users u
  WHERE u.id = caller_user_id
    AND u.email IS NOT NULL
    AND u.email_confirmed_at IS NOT NULL;

  clean_email := lower(btrim(coalesce(verified_email, '')));
  IF clean_email = '' THEN
    RETURN false;
  END IF;

  SELECT * INTO caller_profile
  FROM public.profiles
  WHERE user_id = caller_user_id
  FOR UPDATE;

  -- Existing accounts approved during the compatibility backfill always continue.
  IF FOUND AND caller_profile.account_approved_at IS NOT NULL THEN
    RETURN true;
  END IF;

  -- During Stage 2 the old trigger can create a provisional profile. It may only
  -- become approved by consuming an approved request for the verified email.
  IF caller_profile.id IS NOT NULL THEN
    IF lower(btrim(caller_profile.email)) <> clean_email THEN
      INSERT INTO public.onboarding_auth_audit (
        auth_user_id, normalized_email, event_type, profile_id, details
      ) VALUES (
        caller_user_id, clean_email, 'binding_conflict', caller_profile.id,
        'Provisional profile email did not match the verified authentication email.'
      );
      RETURN false;
    END IF;

    SELECT * INTO approved_request
    FROM public.registration_requests
    WHERE normalized_email = clean_email
      AND status = 'approved'
    ORDER BY reviewed_at
    LIMIT 1
    FOR UPDATE;

    IF approved_request.id IS NULL THEN
      INSERT INTO public.onboarding_auth_audit (
        auth_user_id, normalized_email, event_type, profile_id, details
      ) VALUES (
        caller_user_id, clean_email, 'login_denied', caller_profile.id,
        'Provisional profile had no approved registration request.'
      );
      RETURN false;
    END IF;

    previous_role := caller_profile.app_role;
    PERFORM set_config('public.allow_role_change', 'true', true);
    PERFORM set_config('public.allow_account_activation', 'true', true);
    PERFORM set_config('public.allow_club_change', 'true', true);

    UPDATE public.profiles
    SET
      full_name = approved_request.full_name,
      phone = approved_request.phone,
      imis_id = approved_request.member_imis_id,
      club_id = approved_request.club_id,
      address = approved_request.address,
      city = approved_request.city,
      state = approved_request.state,
      country = approved_request.country,
      education = approved_request.education,
      job_title = approved_request.job_title,
      app_role = 'member'::public.app_role,
      account_approved_at = timezone('utc'::text, now())
    WHERE id = caller_profile.id;

    IF previous_role <> 'member'::public.app_role THEN
      INSERT INTO public.role_audit (
        target_profile_id, previous_role, new_role, changed_by_profile_id
      ) VALUES (
        caller_profile.id, previous_role, 'member'::public.app_role, caller_profile.id
      );
    END IF;

    UPDATE public.registration_requests
    SET
      status = 'activated',
      activated_at = timezone('utc'::text, now()),
      activated_profile_id = caller_profile.id
    WHERE id = approved_request.id;

    INSERT INTO public.registration_request_audit (
      request_id, action, previous_status, new_status,
      previous_club_id, new_club_id, actor_profile_id
    ) VALUES (
      approved_request.id, 'activated', 'approved', 'activated',
      approved_request.club_id, approved_request.club_id, caller_profile.id
    );

    INSERT INTO public.onboarding_auth_audit (
      auth_user_id, normalized_email, event_type, profile_id, registration_request_id
    ) VALUES (
      caller_user_id, clean_email, 'activated', caller_profile.id, approved_request.id
    );
    RETURN true;
  END IF;

  SELECT count(*)::integer INTO matching_profile_count
  FROM public.profiles
  WHERE lower(btrim(email)) = clean_email;

  IF matching_profile_count > 1 THEN
    INSERT INTO public.onboarding_auth_audit (
      auth_user_id, normalized_email, event_type, details
    ) VALUES (
      caller_user_id, clean_email, 'login_conflict',
      'More than one profile matched the verified email.'
    );
    RETURN false;
  END IF;

  SELECT * INTO email_profile
  FROM public.profiles
  WHERE lower(btrim(email)) = clean_email
  LIMIT 1
  FOR UPDATE;

  IF email_profile.id IS NOT NULL THEN
    IF email_profile.user_id IS NOT NULL AND email_profile.user_id <> caller_user_id THEN
      INSERT INTO public.onboarding_auth_audit (
        auth_user_id, normalized_email, event_type, profile_id, details
      ) VALUES (
        caller_user_id, clean_email, 'login_conflict', email_profile.id,
        'Verified email is already bound to a different auth user.'
      );
      RETURN false;
    END IF;

    PERFORM set_config('public.allow_profile_binding', 'true', true);
    PERFORM set_config('public.allow_account_activation', 'true', true);
    UPDATE public.profiles
    SET
      user_id = caller_user_id,
      account_approved_at = coalesce(account_approved_at, timezone('utc'::text, now()))
    WHERE id = email_profile.id;

    INSERT INTO public.onboarding_auth_audit (
      auth_user_id, normalized_email, event_type, profile_id
    ) VALUES (
      caller_user_id, clean_email, 'profile_bound', email_profile.id
    );
    RETURN true;
  END IF;

  SELECT * INTO approved_request
  FROM public.registration_requests
  WHERE normalized_email = clean_email
    AND status = 'approved'
  ORDER BY reviewed_at
  LIMIT 1
  FOR UPDATE;

  IF approved_request.id IS NULL THEN
    INSERT INTO public.onboarding_auth_audit (
      auth_user_id, normalized_email, event_type, details
    ) VALUES (
      caller_user_id, clean_email, 'login_denied',
      'No existing profile or approved registration request matched.'
    );
    RETURN false;
  END IF;

  INSERT INTO public.profiles (
    user_id,
    full_name,
    email,
    phone,
    imis_id,
    club_id,
    app_role,
    address,
    city,
    state,
    country,
    education,
    job_title,
    account_approved_at
  ) VALUES (
    caller_user_id,
    approved_request.full_name,
    clean_email,
    approved_request.phone,
    approved_request.member_imis_id,
    approved_request.club_id,
    'member'::public.app_role,
    approved_request.address,
    approved_request.city,
    approved_request.state,
    approved_request.country,
    approved_request.education,
    approved_request.job_title,
    timezone('utc'::text, now())
  )
  RETURNING id INTO new_profile_id;

  UPDATE public.registration_requests
  SET
    status = 'activated',
    activated_at = timezone('utc'::text, now()),
    activated_profile_id = new_profile_id
  WHERE id = approved_request.id;

  INSERT INTO public.registration_request_audit (
    request_id, action, previous_status, new_status,
    previous_club_id, new_club_id, actor_profile_id
  ) VALUES (
    approved_request.id, 'activated', 'approved', 'activated',
    approved_request.club_id, approved_request.club_id, new_profile_id
  );

  INSERT INTO public.onboarding_auth_audit (
    auth_user_id, normalized_email, event_type, profile_id, registration_request_id
  ) VALUES (
    caller_user_id, clean_email, 'activated', new_profile_id, approved_request.id
  );

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.activate_approved_member() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_approved_member() TO authenticated;
