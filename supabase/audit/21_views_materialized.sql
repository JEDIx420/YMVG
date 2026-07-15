-- ============================================================================
-- YMBD AUDIT SCRIPT 21: PUBLIC VIEWS AND MATERIALIZED VIEWS
-- ============================================================================
-- Purpose: Inspect all views and materialized views in public/storage schemas.
-- Expected Output to Export: View details and definitions.
-- ============================================================================

SELECT
    n.nspname AS schema_name,
    c.relname AS object_name,
    CASE c.relkind
        WHEN 'v' THEN 'view'
        WHEN 'm' THEN 'materialized view'
    END AS object_type,
    pg_get_viewdef(c.oid, true) AS definition
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public', 'storage')
  AND c.relkind IN ('v', 'm')
ORDER BY n.nspname, c.relname;
