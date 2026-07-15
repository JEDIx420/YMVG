-- Read-only existing-user audit. This script never updates or deletes data.

WITH business_rollup AS (
  SELECT
    b.owner_profile_id,
    b.owner_id,
    count(*) AS owned_business_count,
    min(nullif(to_jsonb(b)->>'created_at', '')::timestamptz) AS first_business_created_at
  FROM public.businesses b
  GROUP BY b.owner_profile_id, b.owner_id
)
SELECT
  p.id AS profile_id,
  p.user_id,
  p.email,
  p.created_at AS profile_created_at,
  p.app_role AS role,
  CASE
    WHEN nullif(btrim(p.full_name), '') IS NOT NULL
     AND nullif(btrim(p.phone), '') IS NOT NULL
     AND p.club_id IS NOT NULL
    THEN 'complete'
    ELSE 'incomplete'
  END AS profile_completeness,
  p.club AS current_club_text,
  p.club_id,
  coalesce(br.owned_business_count, 0) AS owned_business_count,
  br.first_business_created_at
FROM public.profiles p
LEFT JOIN LATERAL (
  SELECT
    sum(r.owned_business_count)::bigint AS owned_business_count,
    min(r.first_business_created_at) AS first_business_created_at
  FROM business_rollup r
  WHERE r.owner_profile_id = p.id OR (r.owner_profile_id IS NULL AND r.owner_id = p.user_id)
) br ON true
ORDER BY p.created_at DESC;
