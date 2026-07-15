-- YMBD PRODUCTION PREFLIGHT
-- Read-only checks for the final security package.
--
-- Deployment order is exactly:
--   014_add_review_admin_role.sql
--   015_role_security_and_audit.sql
--   016_public_directory_compatibility.sql
--   017_public_directory_final_cutover.sql
--
-- Migration 013_directory_security_hardening.sql is excluded from this package
-- and must not be executed manually or added to the production migration run.

SELECT version() AS postgres_version;

SELECT version AS applied_migration
FROM supabase_migrations.schema_migrations
WHERE version IN ('013', '014', '015', '016', '017')
ORDER BY version;

SELECT enumlabel AS app_role_value,
       CASE WHEN enumlabel IN ('member', 'business_owner', 'review_admin', 'super_admin')
            THEN 'active'
            ELSE 'legacy_non_elevated'
       END AS role_status
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public' AND t.typname = 'app_role'
ORDER BY e.enumsortorder;

SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'businesses', 'leads', 'analytics_events', 'ad_campaigns')
ORDER BY table_name, ordinal_position;

SELECT n.nspname AS schema_name,
       c.relname AS relation_name,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles', 'businesses', 'leads', 'analytics_events', 'ad_campaigns')
ORDER BY c.relname;

SELECT routine_name,
       routine_type,
       security_type
FROM information_schema.routines
WHERE specific_schema = 'public'
  AND routine_name IN (
    'assign_user_role',
    'promote_to_business_owner',
    'moderate_campaign',
    'create_my_business',
    'keyword_search_businesses'
  )
ORDER BY routine_name;
