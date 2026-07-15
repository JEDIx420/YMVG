-- ============================================================================
-- YMBD AUDIT SCRIPT 02: ALL PUBLIC TABLES, COLUMNS, & DATA TYPES
-- ============================================================================
-- Purpose: Inspect all columns, data types, defaults, and generation status.
-- Expected Output to Export: Table columns details including udt_name (array check).
-- ============================================================================

SELECT 
    table_name,
    column_name,
    ordinal_position,
    data_type,
    udt_schema,
    udt_name,
    is_nullable,
    column_default,
    is_generated,
    generation_expression
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
ORDER BY 
    table_name, ordinal_position;
