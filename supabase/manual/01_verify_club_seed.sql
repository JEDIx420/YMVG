-- Run after 018_club_master.sql and 019_seed_swir_clubs_2025_26.sql.

SELECT district_number, count(*) AS club_count
FROM public.swir_clubs
WHERE source_period = '2025-26'
GROUP BY district_number
ORDER BY district_number;

SELECT zone_number, count(*) AS club_count
FROM public.swir_clubs
WHERE source_period = '2025-26'
GROUP BY zone_number
ORDER BY zone_number;

SELECT region_code, count(*) AS club_count
FROM public.swir_clubs
GROUP BY region_code
ORDER BY region_code;

-- Must return zero rows.
SELECT id, imis_club_id, canonical_name, district_number, zone_number
FROM public.swir_clubs
WHERE zone_number IS DISTINCT FROM public.swir_zone_for_district(district_number);

-- Must return zero rows because iMIS ID is unique in the canonical master.
SELECT imis_club_id, count(*)
FROM public.swir_clubs
GROUP BY imis_club_id
HAVING count(*) > 1;

-- Expected source ambiguity: Hamilton appears twice with different iMIS IDs/districts.
SELECT normalized_name, count(*) AS club_count,
       array_agg(imis_club_id ORDER BY district_number) AS imis_ids,
       array_agg(district_number ORDER BY district_number) AS districts
FROM public.swir_clubs
GROUP BY normalized_name
HAVING count(*) > 1;

SELECT
  count(*) AS total_clubs,
  count(*) FILTER (WHERE is_selectable) AS selectable_clubs,
  count(*) FILTER (WHERE source_period = '2025-26') AS source_period_clubs
FROM public.swir_clubs;

-- Expected: 168 rows, alphabetically ordered, no unselectable rows.
SELECT * FROM public.list_selectable_swir_clubs();
