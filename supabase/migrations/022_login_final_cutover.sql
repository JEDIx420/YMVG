-- Migration: 022_login_final_cutover
-- Purpose: Remove open profile creation and finalize approved login and club protections.
-- Dependencies: Updated frontend/callback deployed and migrations 018 through 021 verified.
-- Do not run this migration during Stage 1.

-- 1. Remove the unrestricted auth.users profile provisioner, including its
-- historical hardcoded super-admin email branch.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Final profile immutability and club-affiliation protection.
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

  IF NEW.club_id IS DISTINCT FROM OLD.club_id
    OR NEW.club IS DISTINCT FROM OLD.club
    OR NEW.ym_club IS DISTINCT FROM OLD.ym_club
    OR NEW.ym_district IS DISTINCT FROM OLD.ym_district
    OR NEW.ym_zone IS DISTINCT FROM OLD.ym_zone
    OR NEW.ym_region IS DISTINCT FROM OLD.ym_region
  THEN
    IF current_setting('public.allow_club_change', true) IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'Club affiliation can only be changed through an approved club assignment.';
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

REVOKE UPDATE ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT UPDATE (
  full_name,
  phone,
  imis_id,
  address,
  city,
  state,
  country,
  education,
  job_title
) ON public.profiles TO authenticated;

-- 3. Before User Created Hook. This function is prepared but is not enabled by SQL.
CREATE OR REPLACE FUNCTION public.before_user_created_approved_email(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  clean_email text := lower(btrim(coalesce(event->'user'->>'email', '')));
BEGIN
  IF clean_email <> '' AND (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE lower(btrim(p.email)) = clean_email
        AND p.account_approved_at IS NOT NULL
    )
    OR EXISTS (
      SELECT 1
      FROM public.registration_requests r
      WHERE r.normalized_email = clean_email
        AND r.status = 'approved'
    )
  ) THEN
    RETURN '{}'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'An approved YMBD account is required.'
    )
  );
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON public.profiles TO supabase_auth_admin;
GRANT SELECT ON public.registration_requests TO supabase_auth_admin;

DROP POLICY IF EXISTS auth_hook_read_approved_profiles ON public.profiles;
CREATE POLICY auth_hook_read_approved_profiles
ON public.profiles
FOR SELECT
TO supabase_auth_admin
USING (account_approved_at IS NOT NULL);

DROP POLICY IF EXISTS auth_hook_read_approved_requests ON public.registration_requests;
CREATE POLICY auth_hook_read_approved_requests
ON public.registration_requests
FOR SELECT
TO supabase_auth_admin
USING (status = 'approved');

REVOKE EXECUTE ON FUNCTION public.before_user_created_approved_email(jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.before_user_created_approved_email(jsonb)
  TO supabase_auth_admin;

-- 4. Preserve the existing create_my_business signature while deriving the
-- authoritative club hierarchy solely from the authenticated profile.
CREATE OR REPLACE FUNCTION public.create_my_business(
  brand_name text,
  category text,
  description text,
  services text[],
  special_offer text,
  address text,
  city text,
  state text,
  country text,
  contact_phone text,
  contact_email text,
  website_url text,
  logo_url text,
  primary_image_url text,
  gallery_urls text[],
  brochure_url text,
  tagline text,
  ym_region text,
  ym_zone text,
  ym_district text,
  ym_club text,
  ym_designation text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_user_id uuid := auth.uid();
  caller_profile_id uuid;
  caller_name text;
  caller_email text;
  caller_phone text;
  caller_club_id uuid;
  caller_club_name text;
  caller_region text;
  caller_district text;
  caller_zone text;
  business_count integer;
  new_business_id uuid;
BEGIN
  IF caller_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required.';
  END IF;

  SELECT
    id,
    full_name,
    email,
    phone,
    club_id,
    ym_club,
    ym_region,
    ym_district,
    ym_zone
  INTO
    caller_profile_id,
    caller_name,
    caller_email,
    caller_phone,
    caller_club_id,
    caller_club_name,
    caller_region,
    caller_district,
    caller_zone
  FROM public.profiles
  WHERE user_id = caller_user_id
    AND account_approved_at IS NOT NULL;

  IF caller_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile Not Found: An approved profile is required.';
  END IF;

  IF caller_club_id IS NULL THEN
    RAISE EXCEPTION 'Club Required: Select your SWIR club before registering a business.';
  END IF;

  SELECT count(*)::integer INTO business_count
  FROM public.businesses
  WHERE owner_id = caller_user_id;

  IF business_count >= 5 THEN
    RAISE EXCEPTION 'Limit Exceeded: You have reached the maximum limit of 5 business profiles.';
  END IF;

  INSERT INTO public.businesses (
    brand_name,
    category,
    description,
    services,
    special_offer,
    address,
    city,
    state,
    country,
    contact_phone,
    contact_email,
    website_url,
    logo_url,
    primary_image_url,
    gallery_urls,
    brochure_url,
    tagline,
    club_id,
    ym_region,
    ym_zone,
    ym_district,
    ym_club,
    ym_designation,
    owner_id,
    owner_profile_id,
    owner_name,
    owner_email,
    owner_phone,
    sponsorship_tier
  ) VALUES (
    brand_name,
    category,
    description,
    services,
    special_offer,
    address,
    city,
    state,
    country,
    contact_phone,
    contact_email,
    website_url,
    logo_url,
    primary_image_url,
    gallery_urls,
    brochure_url,
    tagline,
    caller_club_id,
    caller_region,
    caller_zone,
    caller_district,
    caller_club_name,
    ym_designation,
    caller_user_id,
    caller_profile_id,
    coalesce(caller_name, split_part(caller_email, '@', 1), 'Unknown Owner'),
    caller_email,
    caller_phone,
    0.0
  )
  RETURNING id INTO new_business_id;

  PERFORM public.promote_to_business_owner();
  RETURN new_business_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_my_business(
  text, text, text, text[], text, text, text, text, text, text, text,
  text, text, text, text[], text, text, text, text, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_my_business(
  text, text, text, text[], text, text, text, text, text, text, text,
  text, text, text, text[], text, text, text, text, text, text, text
) TO authenticated;
