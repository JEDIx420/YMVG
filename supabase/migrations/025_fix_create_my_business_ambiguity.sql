-- Migration: 025_fix_create_my_business_ambiguity
-- Purpose: Fix ambiguous column reference 'ym_club' in create_my_business RPC
--          and rename 'current_role' variable in promote_to_business_owner to
--          prevent collision with PostgreSQL reserved keyword CURRENT_ROLE.
-- Dependencies: 022_login_final_cutover.sql, 024_reviewer_profile_linking.sql.

-- 1. Fix create_my_business RPC by qualifying profiles table columns with alias 'p'
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

  -- Must qualify columns with 'p.' to avoid collision with function parameters
  -- (e.g. ym_club, ym_region, ym_district, ym_zone)
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.club_id,
    p.ym_club,
    p.ym_region,
    p.ym_district,
    p.ym_zone
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
  FROM public.profiles p
  WHERE p.user_id = caller_user_id
    AND p.account_approved_at IS NOT NULL;

  IF caller_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile Not Found: An approved profile is required.';
  END IF;

  IF caller_club_id IS NULL THEN
    RAISE EXCEPTION 'Club Required: Select your SWIR club before registering a business.';
  END IF;

  SELECT count(*)::integer INTO business_count
  FROM public.businesses b
  WHERE b.owner_id = caller_user_id;

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
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_my_business(
  text, text, text, text[], text, text, text, text, text, text, text,
  text, text, text, text[], text, text, text, text, text, text, text
) TO authenticated;


-- 2. Fix promote_to_business_owner by renaming 'current_role' variable to avoid
-- colliding with PostgreSQL reserved keyword CURRENT_ROLE (type 'name')
CREATE OR REPLACE FUNCTION public.promote_to_business_owner()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_user_id uuid;
  target_profile_id uuid;
  v_current_role public.app_role;
  owns_business boolean;
BEGIN
  target_user_id := auth.uid();
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- Get current user profile and role
  SELECT p.id, p.app_role INTO target_profile_id, v_current_role
  FROM public.profiles p
  WHERE p.user_id = target_user_id;

  IF target_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found.';
  END IF;

  -- Verify user owns at least one business
  SELECT EXISTS (
    SELECT 1 FROM public.businesses b WHERE b.owner_id = target_user_id
  ) INTO owns_business;

  IF NOT owns_business THEN
    RETURN 'No change: User does not own any business listing.';
  END IF;

  -- Only promote from member -> business_owner
  -- Do not modify any active administrative or ownership role here.
  IF v_current_role = 'member'::public.app_role THEN
    -- Allow role modification in this session
    PERFORM set_config('public.allow_role_change', 'true', true);

    -- Update role
    UPDATE public.profiles
    SET app_role = 'business_owner'::public.app_role
    WHERE id = target_profile_id;

    -- Audit log
    INSERT INTO public.role_audit (target_profile_id, previous_role, new_role, changed_by_profile_id)
    VALUES (target_profile_id, v_current_role, 'business_owner'::public.app_role, target_profile_id);

    RETURN 'User promoted to business_owner.';
  END IF;

  RETURN 'No change: Current role is ' || v_current_role::text;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.promote_to_business_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_to_business_owner() TO authenticated;
