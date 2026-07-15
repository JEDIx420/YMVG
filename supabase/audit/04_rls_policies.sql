-- ============================================================================
-- YMBD AUDIT SCRIPT 04: EVERY ROW-LEVEL SECURITY (RLS) POLICY
-- ============================================================================
-- Purpose: Inspect policy details, target roles, commands, and expressions.
-- Expected Output to Export: Table of RLS policies with USING/WITH CHECK clauses.
-- ============================================================================

SELECT 
    schemaname AS schema_name,
    tablename AS table_name,
    policyname AS policy_name,
    roles AS target_roles,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM 
    pg_policies
WHERE 
    schemaname IN ('public', 'storage')
ORDER BY 
    schemaname, tablename, policyname;
