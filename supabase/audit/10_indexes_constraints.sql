-- ============================================================================
-- YMBD AUDIT SCRIPT 10: INDEXES AND CONSTRAINTS
-- ============================================================================
-- Purpose: Extract index and constraint configurations for primary database.
-- Expected Output to Export: Two tables:
--   1. Indexes mapping.
--   2. Constraints list.
-- ============================================================================

-- Table 1: Indexes
SELECT 
    schemaname AS schema_name,
    tablename AS table_name,
    indexname AS index_name,
    indexdef AS index_definition
FROM 
    pg_indexes
WHERE 
    schemaname = 'public'
ORDER BY 
    tablename, indexname;

-- Table 2: Constraints
SELECT 
    connamespace::regnamespace::text AS schema_name,
    conrelid::regclass::text AS table_name,
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM 
    pg_constraint
WHERE 
    connamespace::regnamespace::text = 'public'
ORDER BY 
    table_name, constraint_name;
