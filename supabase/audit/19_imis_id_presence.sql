-- ============================================================================
-- YMBD AUDIT SCRIPT 19: PRESENCE OF IMIS_ID COLUMNS IN SCHEMAS
-- ============================================================================
-- Purpose: Verify which tables contain the imis_id field.
-- Expected Output to Export: Columns metadata table showing tables containing imis_id.
-- ============================================================================

SELECT 
    table_name, 
    column_name,
    data_type
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name IN ('profiles', 'businesses')
    AND column_name = 'imis_id'
ORDER BY 
    table_name;
