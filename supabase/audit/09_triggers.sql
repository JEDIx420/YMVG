-- ============================================================================
-- YMBD AUDIT SCRIPT 09: TRIGGERS AND TRIGGER DEFINITIONS
-- ============================================================================
-- Purpose: Audit active triggers on public, auth, and storage schemas.
-- Expected Output to Export: Table of trigger names, tables, and definitions.
-- ============================================================================

SELECT 
    t.tgname AS trigger_name,
    c.relname AS table_name,
    n.nspname AS schema_name,
    pg_get_triggerdef(t.oid) AS trigger_definition
FROM 
    pg_trigger t
JOIN 
    pg_class c ON t.tgrelid = c.oid
JOIN 
    pg_namespace n ON c.relnamespace = n.oid
WHERE 
    n.nspname IN ('public', 'auth', 'storage')
    AND NOT t.tgisinternal
ORDER BY 
    table_name, trigger_name;
