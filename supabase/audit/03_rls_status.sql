-- ============================================================================
-- YMBD AUDIT SCRIPT 03: ROW-LEVEL SECURITY STATUS
-- ============================================================================
-- Purpose: Verify if Row-Level Security is active and forced on public/storage tables.
-- Expected Output to Export: Table list with rls_enabled and rls_forced flags.
-- ============================================================================

SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    pg_get_userbyid(c.relowner) AS table_owner,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public', 'storage')
  AND c.relkind IN ('r', 'p')
ORDER BY n.nspname, c.relname;
