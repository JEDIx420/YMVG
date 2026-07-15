-- Run after 022_login_final_cutover.sql.

SELECT
  NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'auth.users'::regclass
      AND tgname = 'on_auth_user_created'
      AND NOT tgisinternal
  ) AS unrestricted_auth_trigger_removed,
  to_regprocedure('public.handle_new_user()') IS NULL AS legacy_handler_removed,
  to_regprocedure('public.before_user_created_approved_email(jsonb)') IS NOT NULL AS auth_hook_function_ready;

SELECT
  has_function_privilege('supabase_auth_admin', 'public.before_user_created_approved_email(jsonb)', 'EXECUTE') AS auth_admin_can_execute_hook,
  has_function_privilege('anon', 'public.before_user_created_approved_email(jsonb)', 'EXECUTE') AS anon_can_execute_hook,
  has_function_privilege('authenticated', 'public.before_user_created_approved_email(jsonb)', 'EXECUTE') AS authenticated_can_execute_hook;

-- Existing profiles must remain approved. Investigate any rows returned.
SELECT id, user_id, email, app_role, created_at
FROM public.profiles
WHERE account_approved_at IS NULL
ORDER BY created_at;

-- Approved requests waiting for first login.
SELECT id, normalized_email, reviewed_at
FROM public.registration_requests
WHERE status = 'approved'
ORDER BY reviewed_at;

-- Activated requests must be linked to profiles and have synchronized hierarchy.
SELECT r.id, r.normalized_email, r.activated_at, p.id AS profile_id,
       p.club_id, p.ym_club, p.ym_district, p.ym_zone, p.ym_region
FROM public.registration_requests r
LEFT JOIN public.profiles p ON p.id = r.activated_profile_id
WHERE r.status = 'activated'
ORDER BY r.activated_at DESC;

-- Must return zero rows.
SELECT p.id, p.email, p.club_id, p.ym_club, p.ym_district, p.ym_zone, p.ym_region
FROM public.profiles p
JOIN public.swir_clubs c ON c.id = p.club_id
WHERE p.ym_club IS DISTINCT FROM c.canonical_name
   OR p.ym_district IS DISTINCT FROM c.district_number::text
   OR p.ym_zone IS DISTINCT FROM c.zone_number::text
   OR p.ym_region IS DISTINCT FROM c.region_code;

-- Must return zero rows.
SELECT b.id, b.club_id, b.ym_club, b.ym_district, b.ym_zone, b.ym_region
FROM public.businesses b
JOIN public.swir_clubs c ON c.id = b.club_id
WHERE b.ym_club IS DISTINCT FROM c.canonical_name
   OR b.ym_district IS DISTINCT FROM c.district_number::text
   OR b.ym_zone IS DISTINCT FROM c.zone_number::text
   OR b.ym_region IS DISTINCT FROM c.region_code;

-- Must return zero rows. This checks all public function bodies, not only one name.
SELECT p.oid::regprocedure AS function_name
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) ILIKE '%jayanand.jayakumar@gmail.com%';

-- Phase 1 public directory remains present and publicly selectable only through its view/RPC.
SELECT
  to_regclass('public.public_businesses') IS NOT NULL AS public_directory_view_exists,
  has_table_privilege('anon', 'public.public_businesses', 'SELECT') AS anon_can_read_public_view,
  has_table_privilege('anon', 'public.businesses', 'SELECT') AS anon_can_read_base_businesses,
  has_function_privilege('anon', 'public.keyword_search_businesses(text,text,text,integer)', 'EXECUTE') AS anon_can_search_directory;
