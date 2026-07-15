-- ============================================================================
-- YMBD AUDIT SCRIPT 13: RLS POLICIES & GRANTS ON STORAGE SCHEMA
-- ============================================================================
-- Purpose: Inspect security rules on storage tables (buckets and objects).
-- Expected Output to Export: RLS storage policy rules and access grants.
-- ============================================================================

-- Table 1: Storage Policies
SELECT 
    tablename AS table_name,
    policyname AS policy_name,
    roles AS target_roles,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM 
    pg_policies
WHERE 
    schemaname = 'storage'
ORDER BY 
    tablename, policyname;

-- Table 2: Storage Grants
SELECT 
    grantee,
    table_name,
    privilege_type
FROM 
    information_schema.role_table_grants
WHERE 
    table_schema = 'storage'
    AND grantee IN ('anon', 'authenticated', 'service_role', 'public')
ORDER BY 
    table_name, grantee, privilege_type;
