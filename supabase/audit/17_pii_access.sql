-- ============================================================================
-- YMBD AUDIT SCRIPT 17: ACCESS TO PRIVATE PII COLUMNS
-- ============================================================================
-- Purpose: Inspect which roles have access to emails, phones, or payment proofs.
-- Expected Output to Export: Two tables:
--   1. Column grants on private fields.
--   2. Functions returning private attributes.
-- ============================================================================

-- Table 1: Column grants on private fields
SELECT 
    grantee,
    table_name,
    column_name,
    privilege_type
FROM 
    information_schema.role_column_grants
WHERE 
    table_schema = 'public'
    AND column_name IN ('owner_email', 'owner_phone', 'payment_proof_url')
ORDER BY 
    table_name, column_name, grantee;

-- Table 2: Functions returning private attributes
SELECT 
    proname AS function_name,
    pg_get_function_result(oid) AS return_type
FROM 
    pg_proc
WHERE 
    pronamespace = 'public'::regnamespace
    AND (
        pg_get_function_result(oid) LIKE '%owner_email%'
        OR pg_get_function_result(oid) LIKE '%owner_phone%'
        OR pg_get_function_result(oid) LIKE '%payment_proof_url%'
    )
ORDER BY 
    proname;
