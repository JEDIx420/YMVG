-- Migration: 018_club_master
-- Purpose: Add the canonical SWIR club master and standardize profile/business affiliation.
-- Dependencies: 014_add_review_admin_role.sql through 017_public_directory_final_cutover.sql.
-- This migration does not backfill or overwrite legacy text-only affiliations.

CREATE OR REPLACE FUNCTION public.normalize_club_name(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public, pg_temp
AS $$
  SELECT regexp_replace(lower(btrim(coalesce(value, ''))), '\s+', ' ', 'g');
$$;

CREATE OR REPLACE FUNCTION public.swir_zone_for_district(district_number integer)
RETURNS smallint
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN district_number BETWEEN 1 AND 2 THEN 1::smallint
    WHEN district_number BETWEEN 3 AND 4 THEN 2::smallint
    WHEN district_number BETWEEN 5 AND 7 THEN 3::smallint
    WHEN district_number BETWEEN 8 AND 10 THEN 4::smallint
    ELSE NULL
  END;
$$;

CREATE TABLE IF NOT EXISTS public.swir_clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imis_club_id text NOT NULL UNIQUE CHECK (imis_club_id ~ '^[0-9]+$'),
  canonical_name text NOT NULL CHECK (btrim(canonical_name) <> ''),
  normalized_name text GENERATED ALWAYS AS (public.normalize_club_name(canonical_name)) STORED,
  club_type text NOT NULL CHECK (btrim(club_type) <> ''),
  club_status text NOT NULL CHECK (btrim(club_status) <> ''),
  district_number smallint NOT NULL CHECK (district_number BETWEEN 1 AND 10),
  zone_number smallint GENERATED ALWAYS AS (public.swir_zone_for_district(district_number)) STORED,
  region_code text NOT NULL DEFAULT 'SWIR' CHECK (region_code = 'SWIR'),
  is_selectable boolean NOT NULL DEFAULT true,
  source_period text NOT NULL CHECK (btrim(source_period) <> ''),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT swir_clubs_selectable_active_check
    CHECK (NOT is_selectable OR lower(club_status) = 'active')
);

CREATE INDEX IF NOT EXISTS idx_swir_clubs_normalized_name
  ON public.swir_clubs(normalized_name);
CREATE INDEX IF NOT EXISTS idx_swir_clubs_selectable_sort
  ON public.swir_clubs(is_selectable, canonical_name, district_number);

ALTER TABLE public.swir_clubs ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON public.swir_clubs FROM PUBLIC, anon, authenticated;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES public.swir_clubs(id) ON DELETE RESTRICT;
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES public.swir_clubs(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_profiles_club_id ON public.profiles(club_id);
CREATE INDEX IF NOT EXISTS idx_businesses_club_id ON public.businesses(club_id);

CREATE OR REPLACE FUNCTION public.sync_profile_swir_club_hierarchy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  selected_club public.swir_clubs%ROWTYPE;
BEGIN
  IF NEW.club_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO selected_club
  FROM public.swir_clubs
  WHERE id = NEW.club_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid club selection.';
  END IF;

  NEW.club := selected_club.canonical_name;
  NEW.ym_club := selected_club.canonical_name;
  NEW.ym_district := selected_club.district_number::text;
  NEW.ym_zone := selected_club.zone_number::text;
  NEW.ym_region := selected_club.region_code;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_business_swir_club_hierarchy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  selected_club public.swir_clubs%ROWTYPE;
BEGIN
  -- During the staged frontend rollout, the existing create_my_business RPC does
  -- not yet pass club_id. New listings still inherit it from the owner profile.
  IF TG_OP = 'INSERT' AND NEW.club_id IS NULL THEN
    SELECT p.club_id INTO NEW.club_id
    FROM public.profiles p
    WHERE (NEW.owner_profile_id IS NOT NULL AND p.id = NEW.owner_profile_id)
       OR (NEW.owner_profile_id IS NULL AND NEW.owner_id IS NOT NULL AND p.user_id = NEW.owner_id)
    ORDER BY (p.id = NEW.owner_profile_id) DESC
    LIMIT 1;
  END IF;

  IF NEW.club_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO selected_club
  FROM public.swir_clubs
  WHERE id = NEW.club_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid club selection.';
  END IF;

  NEW.ym_club := selected_club.canonical_name;
  NEW.ym_district := selected_club.district_number::text;
  NEW.ym_zone := selected_club.zone_number::text;
  NEW.ym_region := selected_club.region_code;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_swir_club ON public.profiles;
CREATE TRIGGER trg_sync_profile_swir_club
BEFORE INSERT OR UPDATE OF club_id, club, ym_club, ym_district, ym_zone, ym_region
ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_swir_club_hierarchy();

DROP TRIGGER IF EXISTS trg_sync_business_swir_club ON public.businesses;
CREATE TRIGGER trg_sync_business_swir_club
BEFORE INSERT OR UPDATE OF club_id, ym_club, ym_district, ym_zone, ym_region
ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.sync_business_swir_club_hierarchy();

CREATE TABLE IF NOT EXISTS public.profile_club_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  previous_club_id uuid REFERENCES public.swir_clubs(id) ON DELETE RESTRICT,
  new_club_id uuid NOT NULL REFERENCES public.swir_clubs(id) ON DELETE RESTRICT,
  changed_by_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  changed_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profile_club_audit_target
  ON public.profile_club_audit(target_profile_id, changed_at DESC);

ALTER TABLE public.profile_club_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON public.profile_club_audit FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.profile_club_audit TO authenticated;

DROP POLICY IF EXISTS select_profile_club_audit_reviewers ON public.profile_club_audit;
CREATE POLICY select_profile_club_audit_reviewers
ON public.profile_club_audit
FOR SELECT
TO authenticated
USING (
  (SELECT app_role FROM public.profiles WHERE user_id = auth.uid())
    IN ('review_admin'::public.app_role, 'super_admin'::public.app_role)
);

CREATE OR REPLACE FUNCTION public.list_selectable_swir_clubs()
RETURNS TABLE (
  id uuid,
  imis_club_id text,
  canonical_name text,
  club_type text,
  district_number smallint,
  zone_number smallint,
  region_code text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    c.id,
    c.imis_club_id,
    c.canonical_name,
    c.club_type,
    c.district_number,
    c.zone_number,
    c.region_code
  FROM public.swir_clubs c
  WHERE c.is_selectable
  ORDER BY c.canonical_name, c.district_number, c.imis_club_id;
$$;

CREATE OR REPLACE FUNCTION public.set_my_initial_club(p_club_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_profile_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.swir_clubs
    WHERE id = p_club_id AND is_selectable
  ) THEN
    RAISE EXCEPTION 'Invalid club selection.';
  END IF;

  SELECT id INTO caller_profile_id
  FROM public.profiles
  WHERE user_id = auth.uid()
  FOR UPDATE;

  IF caller_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = caller_profile_id AND club_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Club affiliation has already been set.';
  END IF;

  PERFORM set_config('public.allow_club_change', 'true', true);
  UPDATE public.profiles SET club_id = p_club_id WHERE id = caller_profile_id;

  RETURN 'Club affiliation saved.';
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_profile_club(
  target_profile_id uuid,
  p_club_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_profile_id uuid;
  caller_role public.app_role;
  old_club_id uuid;
BEGIN
  SELECT id, app_role INTO caller_profile_id, caller_role
  FROM public.profiles
  WHERE user_id = auth.uid();

  IF caller_profile_id IS NULL OR caller_role NOT IN (
    'review_admin'::public.app_role,
    'super_admin'::public.app_role
  ) THEN
    RAISE EXCEPTION 'Reviewer permissions required.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.swir_clubs WHERE id = p_club_id) THEN
    RAISE EXCEPTION 'Invalid club selection.';
  END IF;

  SELECT club_id INTO old_club_id
  FROM public.profiles
  WHERE id = target_profile_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found.';
  END IF;

  PERFORM set_config('public.allow_club_change', 'true', true);
  UPDATE public.profiles SET club_id = p_club_id WHERE id = target_profile_id;

  INSERT INTO public.profile_club_audit (
    target_profile_id,
    previous_club_id,
    new_club_id,
    changed_by_profile_id
  ) VALUES (
    target_profile_id,
    old_club_id,
    p_club_id,
    caller_profile_id
  );

  RETURN 'Club affiliation updated.';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.normalize_club_name(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.swir_zone_for_district(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_profile_swir_club_hierarchy() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_business_swir_club_hierarchy() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.list_selectable_swir_clubs() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_selectable_swir_clubs() TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.set_my_initial_club(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_my_initial_club(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.assign_profile_club(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_profile_club(uuid, uuid) TO authenticated;
