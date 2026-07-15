-- ============================================================================
-- YMBD AUDIT SCRIPT 12: STORAGE BUCKETS CONFIGURATION
-- ============================================================================
-- Purpose: Audit Supabase Storage bucket visibility configurations.
-- Expected Output to Export: Bucket lists detailing public flag and constraints.
-- ============================================================================

SELECT 
    id AS bucket_id, 
    name AS bucket_name, 
    public AS is_public, 
    file_size_limit, 
    allowed_mime_types 
FROM 
    storage.buckets;
