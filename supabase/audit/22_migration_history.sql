-- ============================================================================
-- YMBD AUDIT SCRIPT 22: SUPABASE MIGRATION HISTORY
-- ============================================================================
-- Purpose: Extract the list of migrations executed in the database.
-- Expected Output to Export: List of migration version keys.
-- ============================================================================

SELECT 
    table_schema AS schema_name, 
    table_name 
FROM 
    information_schema.tables 
WHERE 
    table_name LIKE '%migration%'
ORDER BY 
    table_schema, table_name;

SELECT version FROM supabase_migrations.schema_migrations ORDER BY version ASC;
