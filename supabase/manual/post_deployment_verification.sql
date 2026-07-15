-- YMBD POST-DEPLOYMENT VERIFICATION
-- Read-only checks. Review every result before declaring the package complete.
-- Migration 013 is intentionally absent from the production sequence.

-- 1. The only package migrations expected to be applied.
SELECT version,
       CASE WHEN version IN ('014', '015', '016', '017') THEN 'expected'
            WHEN version = '013' THEN 'FAIL: legacy migration must be excluded'
            ELSE 'other migration'
       END AS status
FROM supabase_migrations.schema_migrations
WHERE version IN ('013', '014', '015', '016', '017')
ORDER BY version;

-- 2. Legacy roles may exist as enum values or historical rows, but must not
-- be present in active policy expressions or role-assignment grants.
SELECT enumlabel AS enum_role,
       count(p.id) FILTER (WHERE p.app_role::text = enumlabel) AS profile_rows
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
LEFT JOIN public.profiles p ON p.app_role::text = e.enumlabel
WHERE n.nspname = 'public' AND t.typname = 'app_role'
GROUP BY enumlabel, e.enumsortorder
ORDER BY e.enumsortorder;

SELECT policyname, tablename, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('businesses', 'leads', 'analytics_events', 'ad_campaigns')
ORDER BY tablename, policyname;

-- 3. Confirm the pause/resume boundary is the reviewer RPC, not owner UPDATE.
SELECT p.policyname,
       p.tablename,
       p.cmd,
       p.qual,
       p.with_check
FROM pg_policies p
WHERE p.schemaname = 'public' AND p.tablename = 'ad_campaigns';

SELECT has_function_privilege(
  'anon',
  'public.moderate_campaign(uuid,text)',
  'EXECUTE'
) AS anon_can_moderate_campaign,
has_function_privilege(
  'authenticated',
  'public.moderate_campaign(uuid,text)',
  'EXECUTE'
) AS authenticated_can_call_moderate_campaign;

SELECT has_function_privilege(
  'anon',
  'public.keyword_search_businesses(text,text,text,integer)',
  'EXECUTE'
) AS anon_can_search,
has_function_privilege(
  'authenticated',
  'public.keyword_search_businesses(text,text,text,integer)',
  'EXECUTE'
) AS authenticated_can_search;

-- 4. Public directory exposure is limited to the compatibility view.
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'public_businesses'
  AND grantee IN ('public', 'anon', 'authenticated')
ORDER BY grantee, privilege_type;

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND grantee IN ('public', 'anon', 'authenticated')
ORDER BY grantee, privilege_type;

-- 5. Direct profile app_role mutation must not be granted.
SELECT grantee, table_name, column_name, privilege_type
FROM information_schema.role_column_grants
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'app_role'
ORDER BY grantee;
