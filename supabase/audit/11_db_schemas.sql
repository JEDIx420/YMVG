-- ============================================================================
-- YMBD AUDIT SCRIPT 11: DATABASE SCHEMAS AND POSSIBLE POSTGREST CONFIGURATION
-- ============================================================================
-- Purpose: Inspect database schema list and PostgREST API exposure paths.
-- Expected Output to Export: Database schemas and configured API schemas parameters.
-- ============================================================================

SELECT 
    nspname AS schema_name,
    pg_get_userbyid(nspowner) AS schema_owner
FROM 
    pg_namespace
WHERE 
    nspname NOT LIKE 'pg_%' AND nspname != 'information_schema'
ORDER BY 
    schema_name;

SELECT
    current_setting('pgrst.db_schemas', true) AS postgrest_exposed_schemas,
    current_setting('pgrst.db_extra_search_path', true) AS postgrest_extra_search_path;
