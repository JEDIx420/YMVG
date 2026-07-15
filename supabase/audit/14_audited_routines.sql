-- ============================================================================
-- YMBD AUDIT SCRIPT 14: CURRENT PRESENCE OF AUDITED ROUTINES
-- ============================================================================
-- Purpose: Quick presence verification of key application search/security routines.
-- Expected Output to Export: Table listing the defined signatures of audited functions.
-- ============================================================================

SELECT 
    proname AS function_name,
    pg_get_function_arguments(oid) AS argument_types,
    pg_get_function_result(oid) AS return_type,
    prosecdef AS is_security_definer
FROM 
    pg_proc
WHERE 
    pronamespace = 'public'::regnamespace
    AND proname IN (
        'keyword_search_businesses', 
        'hybrid_search_businesses', 
        'get_my_role', 
        'handle_new_user'
    )
ORDER BY 
    proname;
