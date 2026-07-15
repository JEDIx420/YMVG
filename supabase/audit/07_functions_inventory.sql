-- ============================================================================
-- YMBD AUDIT SCRIPT 07: ALL FUNCTIONS/RPCS, ARGUMENTS, OWNERS, & EXECUTE PRIVILEGES
-- ============================================================================
-- Purpose: Catalog all functions and execution permissions for default roles.
-- Expected Output to Export: Two tables:
--   1. Functions metadata (owner, security definer state, proconfig options).
--   2. EXECUTE grants per user role.
-- ============================================================================

-- Table 1: Functions Inventory
SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS argument_types,
    pg_get_function_result(p.oid) AS return_type,
    pg_get_userbyid(p.proowner) AS function_owner,
    p.prosecdef AS is_security_definer,
    p.proconfig AS function_configuration
FROM 
    pg_proc p
JOIN 
    pg_namespace n ON p.pronamespace = n.oid
WHERE 
    n.nspname = 'public'
ORDER BY 
    function_name;

-- Table 2: Function Execution Grants
SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    r.rolname AS grantee,
    has_function_privilege(r.oid, p.oid, 'EXECUTE') AS has_execute_permission
FROM 
    pg_proc p
JOIN 
    pg_namespace n ON p.pronamespace = n.oid
CROSS JOIN 
    (SELECT oid, rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role', 'public')) r
WHERE 
    n.nspname = 'public'
ORDER BY 
    function_name, grantee;
