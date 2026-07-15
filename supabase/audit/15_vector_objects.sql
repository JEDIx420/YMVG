-- ============================================================================
-- YMBD AUDIT SCRIPT 15: PGVECTOR EXTENSION AND RELATED SCHEMA OBJECTS
-- ============================================================================
-- Purpose: Verify existence of pgvector extension, vector columns, and vector indexes.
-- Expected Output to Export: Four tables checking for extension, columns, indexes, 
-- and functions matching 'vector'.
-- ============================================================================

-- Table 1: Check if vector extension exists
SELECT 
    extname AS extension_name, 
    extversion AS extension_version 
FROM 
    pg_extension 
WHERE 
    extname = 'vector';

-- Table 2: Check for vector data columns
SELECT 
    table_name, 
    column_name, 
    data_type, 
    udt_name
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND (udt_name = 'vector' OR data_type = 'vector')
ORDER BY 
    table_name, column_name;

-- Table 3: Check for vector index definitions
SELECT 
    tablename AS table_name,
    indexname AS index_name,
    indexdef AS index_definition
FROM 
    pg_indexes
WHERE 
    schemaname = 'public'
    AND indexdef LIKE '%vector%'
ORDER BY 
    tablename;

-- Table 4: Check for functions with vector references
SELECT 
    proname AS function_name,
    pg_get_function_arguments(oid) AS argument_types,
    pg_get_function_result(oid) AS return_type
FROM 
    pg_proc
WHERE 
    proname LIKE '%vector%'
    OR pg_get_function_arguments(oid) LIKE '%vector%'
    OR pg_get_function_result(oid) LIKE '%vector%'
ORDER BY 
    proname;
