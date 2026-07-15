-- ============================================================================
-- YMBD AUDIT SCRIPT 20: REALTIME / LOGICAL REPLICATION PUBLICATION MEMBERSHIP
-- ============================================================================
-- Purpose: List tables participating in logical replication publications.
-- Expected Output to Export: Replication table names and publications.
-- ============================================================================

SELECT 
    pubname AS publication_name,
    schemaname AS schema_name,
    tablename AS table_name
FROM 
    pg_publication_tables
ORDER BY 
    publication_name, table_name;
