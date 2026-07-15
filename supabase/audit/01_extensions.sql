-- ============================================================================
-- YMBD AUDIT SCRIPT 01: POSTGRESQL VERSION & ENABLED EXTENSIONS
-- ============================================================================
-- Purpose: Inspect PostgreSQL engine version and check active extensions.
-- Expected Output to Export: Table of extension names and active versions.
-- ============================================================================

SELECT version() AS postgres_version;

SELECT 
    extname AS extension_name, 
    extversion AS extension_version 
FROM 
    pg_extension 
ORDER BY 
    extname;
