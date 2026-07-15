-- ============================================================================
-- YMBD AUDIT SCRIPT 08: DEFINITIONS OF APPLICATION-CREATED FUNCTIONS
-- ============================================================================
-- Purpose: Extract exact source definitions of core directory function routines.
-- Expected Output to Export: Source definitions of targeted functions.
-- WARNING: Output may contain hardcoded administrator emails, internal API tokens/secrets,
-- or operational details. Review carefully.
-- ============================================================================

SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM 
    pg_proc p
JOIN 
    pg_namespace n ON p.pronamespace = n.oid
WHERE 
    n.nspname = 'public'
    AND p.proname IN (
        'keyword_search_businesses', 
        'hybrid_search_businesses', 
        'get_my_role', 
        'handle_new_user', 
        'check_business_limit', 
        'check_imis_limit'
    )
ORDER BY 
    function_name;
