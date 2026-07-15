-- ============================================================================
-- YMBD AUDIT SCRIPT 05: TABLE-LEVEL GRANTS FOR DEFAULT SUPABASE ROLES
-- ============================================================================
-- Purpose: Inspect table privileges assigned to anon, authenticated, public, etc.
-- Expected Output to Export: Table privileges mapping including grantee role.
-- ============================================================================

SELECT 
    grantee,
    table_schema AS schema_name,
    table_name,
    privilege_type,
    is_grantable
FROM 
    information_schema.role_table_grants
WHERE 
    table_schema IN ('public', 'storage')
    AND grantee IN ('anon', 'authenticated', 'service_role', 'public')
ORDER BY 
    table_schema, table_name, grantee, privilege_type;
