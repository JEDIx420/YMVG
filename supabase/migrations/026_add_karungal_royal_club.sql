-- Migration: 026_add_karungal_royal_club
-- Purpose: Allow nullable imis_club_id for clubs where iMIS ID is not yet assigned,
--          and seed the new club 'Karungal Royal' (District 1, Zone 1, Region SWIR).
-- Dependencies: 018_club_master.sql, 019_seed_swir_clubs_2025_26.sql.

-- 1. Allow nullable imis_club_id and update check constraint
ALTER TABLE public.swir_clubs
  ALTER COLUMN imis_club_id DROP NOT NULL;

ALTER TABLE public.swir_clubs
  DROP CONSTRAINT IF EXISTS swir_clubs_imis_club_id_check;

ALTER TABLE public.swir_clubs
  ADD CONSTRAINT swir_clubs_imis_club_id_check
  CHECK (imis_club_id IS NULL OR imis_club_id ~ '^[0-9]+$');

-- 2. Idempotently insert 'Karungal Royal'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.swir_clubs
    WHERE normalized_name = public.normalize_club_name('Karungal Royal')
      AND district_number = 1
  ) THEN
    INSERT INTO public.swir_clubs (
      imis_club_id,
      canonical_name,
      club_type,
      club_status,
      district_number,
      region_code,
      is_selectable,
      source_period
    ) VALUES (
      NULL,
      'Karungal Royal',
      'Y''s Men''s Club',
      'Active',
      1::smallint,
      'SWIR',
      true,
      '2026-27'
    );
  END IF;
END;
$$;
