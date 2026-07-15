-- ============================================================================
-- YMBD AUDIT SCRIPT 16: GRANTS ENABLING MUTATIONS ON Profiles.app_role
-- ============================================================================
-- Purpose: Verify update privileges on profiles and profiles.app_role column.
-- Expected Output to Export: Two tables:
--   1. Table-level update grants.
--   2. Column-level update grants.
-- ============================================================================

-- Table 1: Table-level update permissions
SELECT 
    grantee,
    table_name,
    privilege_type
FROM 
    information_schema.role_table_grants
WHERE 
    table_schema = 'public'
    AND table_name = 'profiles'
    AND privilege_type = 'UPDATE'
ORDER BY 
    grantee;

-- Table 2: Column-level update permissions on profiles.app_role
SELECT 
    grantee,
    table_name,
    column_name,
    privilege_type
FROM 
    information_schema.role_column_grants
WHERE 
    table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'app_role'
ORDER BY 
    grantee;
