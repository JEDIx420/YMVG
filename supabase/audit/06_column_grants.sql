-- ============================================================================
-- YMBD AUDIT SCRIPT 06: COLUMN-LEVEL GRANTS
-- ============================================================================
-- Purpose: Audit explicit column grants configuration.
-- Expected Output to Export: Columns metadata mapping grants.
-- ============================================================================

SELECT 
    grantee,
    table_schema AS schema_name,
    table_name,
    column_name,
    privilege_type,
    is_grantable
FROM 
    information_schema.role_column_grants
WHERE 
    table_schema IN ('public', 'storage')
    AND grantee IN ('anon', 'authenticated', 'service_role', 'public')
ORDER BY 
    table_schema, table_name, column_name, grantee, privilege_type;
