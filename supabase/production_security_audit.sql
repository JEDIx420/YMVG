-- ============================================================================
-- YMBD PRODUCTION SECURITY & DOCUMENTATION AUDIT SCRIPT
-- ============================================================================
-- IMPORTANT RULES:
-- 1. This script is strictly READ-ONLY.
-- 2. It contains only queries, CTEs (WITH), and show/current_setting commands.
-- 3. It contains NO data mutation statements (INSERT, UPDATE, DELETE, etc.).
-- 4. It does not extract or print private user PII records.
-- 5. CAUTION: pg_get_functiondef() output may contain hardcoded administrator
--    emails, internal API tokens/secrets, or operational details. Review carefully.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. POSTGRESQL VERSION & ENABLED EXTENSIONS
-- ----------------------------------------------------------------------------
SELECT '1. POSTGRESQL VERSION & ENABLED EXTENSIONS' AS heading;

SELECT version() AS postgres_version;

SELECT 
    extname AS extension_name, 
    extversion AS extension_version 
FROM 
    pg_extension 
ORDER BY 
    extname;

-- ----------------------------------------------------------------------------
-- 2. ALL PUBLIC TABLES, COLUMNS, & DATA TYPES (WITH DEFAULTS & ARRAY TYPES)
-- ----------------------------------------------------------------------------
SELECT '2. ALL PUBLIC TABLES, COLUMNS, & DATA TYPES' AS heading;

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

-- ----------------------------------------------------------------------------
-- 3. ROW-LEVEL SECURITY STATUS
-- ----------------------------------------------------------------------------
SELECT '3. ROW-LEVEL SECURITY STATUS' AS heading;

SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    pg_get_userbyid(c.relowner) AS table_owner,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public', 'storage')
  AND c.relkind IN ('r', 'p')
ORDER BY n.nspname, c.relname;

-- ----------------------------------------------------------------------------
-- 4. EVERY ROW-LEVEL SECURITY (RLS) POLICY
-- ----------------------------------------------------------------------------
SELECT '4. EVERY ROW-LEVEL SECURITY (RLS) POLICY' AS heading;

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

-- ----------------------------------------------------------------------------
-- 5. TABLE-LEVEL GRANTS FOR ANON, AUTHENTICATED, & SERVICE_ROLE
-- ----------------------------------------------------------------------------
SELECT '5. TABLE-LEVEL GRANTS FOR ANON, AUTHENTICATED, & SERVICE_ROLE' AS heading;

SELECT 
    grantee,
    table_schema AS schema_name,
    table_name,
    privilege_type,
    is_grantable
FROM 
    information_schema.role_table_grants
WHERE 
    table_schema IN ('public', 'storage')
    AND grantee IN ('anon', 'authenticated', 'service_role', 'public')
ORDER BY 
    table_schema, table_name, grantee, privilege_type;

-- ----------------------------------------------------------------------------
-- 6. COLUMN-LEVEL GRANTS
-- ----------------------------------------------------------------------------
SELECT '6. COLUMN-LEVEL GRANTS' AS heading;

SELECT 
    grantee,
    table_schema AS schema_name,
    table_name,
    column_name,
    privilege_type,
    is_grantable
FROM 
    information_schema.role_column_grants
WHERE 
    table_schema IN ('public', 'storage')
    AND grantee IN ('anon', 'authenticated', 'service_role', 'public')
ORDER BY 
    table_schema, table_name, column_name, grantee, privilege_type;

-- ----------------------------------------------------------------------------
-- 7. ALL FUNCTIONS/RPCS, ARGUMENTS, OWNERS, & DEFINE STATE
-- ----------------------------------------------------------------------------
SELECT '7. ALL FUNCTIONS/RPCS, ARGUMENTS, OWNERS, & DEFINE STATE' AS heading;

SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS argument_types,
    pg_get_function_result(p.oid) AS return_type,
    pg_get_userbyid(p.proowner) AS function_owner,
    p.prosecdef AS is_security_definer,
    p.proconfig AS function_configuration
FROM 
    pg_proc p
JOIN 
    pg_namespace n ON p.pronamespace = n.oid
WHERE 
    n.nspname = 'public'
ORDER BY 
    function_name;

-- Function Execution Grants for default Supabase Tiers
SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    r.rolname AS grantee,
    has_function_privilege(r.oid, p.oid, 'EXECUTE') AS has_execute_permission
FROM 
    pg_proc p
JOIN 
    pg_namespace n ON p.pronamespace = n.oid
CROSS JOIN 
    (SELECT oid, rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role', 'public')) r
WHERE 
    n.nspname = 'public'
ORDER BY 
    function_name, grantee;

-- ----------------------------------------------------------------------------
-- 8. DEFINITIONS OF MAIN APPLICATION-CREATED FUNCTIONS
-- ----------------------------------------------------------------------------
SELECT '8. DEFINITIONS OF MAIN APPLICATION-CREATED FUNCTIONS' AS heading;

SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM 
    pg_proc p
JOIN 
    pg_namespace n ON p.pronamespace = n.oid
WHERE 
    n.nspname = 'public'
    AND p.proname IN (
        'keyword_search_businesses', 
        'hybrid_search_businesses', 
        'get_my_role', 
        'handle_new_user', 
        'check_business_limit', 
        'check_imis_limit'
    )
ORDER BY 
    function_name;

-- ----------------------------------------------------------------------------
-- 9. TRIGGERS AND TRIGGER DEFINITIONS
-- ----------------------------------------------------------------------------
SELECT '9. TRIGGERS AND TRIGGER DEFINITIONS' AS heading;

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

-- ----------------------------------------------------------------------------
-- 10. INDEXES AND CONSTRAINTS
-- ----------------------------------------------------------------------------
SELECT '10. INDEXES AND CONSTRAINTS' AS heading;

-- Indexes
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

-- Constraints
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

-- ----------------------------------------------------------------------------
-- 11. DATABASE SCHEMAS AND POSSIBLE POSTGREST CONFIGURATION
-- ----------------------------------------------------------------------------
SELECT '11. DATABASE SCHEMAS AND POSSIBLE POSTGREST CONFIGURATION' AS heading;

SELECT 
    nspname AS schema_name,
    pg_get_userbyid(nspowner) AS schema_owner
FROM 
    pg_namespace
WHERE 
    nspname NOT LIKE 'pg_%' AND nspname != 'information_schema'
ORDER BY 
    schema_name;

SELECT
    current_setting('pgrst.db_schemas', true) AS postgrest_exposed_schemas,
    current_setting('pgrst.db_extra_search_path', true) AS postgrest_extra_search_path;

-- ----------------------------------------------------------------------------
-- 12. STORAGE BUCKETS CONFIGURATION
-- ----------------------------------------------------------------------------
SELECT '12. STORAGE BUCKETS CONFIGURATION' AS heading;

-- Safe check to query buckets if storage schema exists
SELECT 
    id AS bucket_id, 
    name AS bucket_name, 
    public AS is_public, 
    file_size_limit, 
    allowed_mime_types 
FROM 
    storage.buckets;

-- ----------------------------------------------------------------------------
-- 13. RLS POLICIES & GRANTS ON STORAGE
-- ----------------------------------------------------------------------------
SELECT '13. RLS POLICIES & GRANTS ON STORAGE' AS heading;

-- Policies on Storage schema tables (buckets, objects)
SELECT 
    tablename AS table_name,
    policyname AS policy_name,
    roles AS target_roles,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM 
    pg_policies
WHERE 
    schemaname = 'storage'
ORDER BY 
    tablename, policyname;

-- Table-level grants on Storage schema
SELECT 
    grantee,
    table_name,
    privilege_type
FROM 
    information_schema.role_table_grants
WHERE 
    table_schema = 'storage'
    AND grantee IN ('anon', 'authenticated', 'service_role', 'public')
ORDER BY 
    table_name, grantee, privilege_type;

-- ----------------------------------------------------------------------------
-- 14. CURRENT PRESENCE OF SPECIFIC AUDITED ROUTINES
-- ----------------------------------------------------------------------------
SELECT '14. CURRENT PRESENCE OF SPECIFIC AUDITED ROUTINES' AS heading;

SELECT 
    proname AS function_name,
    pg_get_function_arguments(oid) AS argument_types,
    pg_get_function_result(oid) AS return_type,
    prosecdef AS is_security_definer
FROM 
    pg_proc
WHERE 
    pronamespace = 'public'::regnamespace
    AND proname IN (
        'keyword_search_businesses', 
        'hybrid_search_businesses', 
        'get_my_role', 
        'handle_new_user'
    )
ORDER BY 
    proname;

-- ----------------------------------------------------------------------------
-- 15. PGVECTOR EXTENSION AND RELATED SCHEMA OBJECTS
-- ----------------------------------------------------------------------------
SELECT '15. PGVECTOR EXTENSION AND RELATED SCHEMA OBJECTS' AS heading;

-- Check if vector extension exists
SELECT 
    extname AS extension_name, 
    extversion AS extension_version 
FROM 
    pg_extension 
WHERE 
    extname = 'vector';

-- Check for vector data columns
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

-- Check for vector index definitions
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

-- Check for functions with vector references
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

-- ----------------------------------------------------------------------------
-- 16. GRANTS ENABLING MUTATIONS ON Profiles.app_role
-- ----------------------------------------------------------------------------
SELECT '16. GRANTS ENABLING MUTATIONS ON Profiles.app_role' AS heading;

-- Table-level update permissions
SELECT 
    grantee,
    table_name,
    privilege_type
FROM 
    information_schema.role_table_grants
WHERE 
    table_schema = 'public'
    AND table_name = 'profiles'
    AND privilege_type = 'UPDATE'
ORDER BY 
    grantee;

-- Column-level update permissions on profiles.app_role
SELECT 
    grantee,
    table_name,
    column_name,
    privilege_type
FROM 
    information_schema.role_column_grants
WHERE 
    table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'app_role'
ORDER BY 
    grantee;

-- ----------------------------------------------------------------------------
-- 17. ACCESS TO PRIVATE PII COLUMNS IN SCHEMAS/VIEWS/FUNCTIONS
-- ----------------------------------------------------------------------------
SELECT '17. ACCESS TO PRIVATE PII COLUMNS IN SCHEMAS/VIEWS/FUNCTIONS' AS heading;

-- Column grants on private fields
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

-- Functions returning private attributes
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

-- ----------------------------------------------------------------------------
-- EFFECTIVE SENSITIVE COLUMN PRIVILEGES
-- ----------------------------------------------------------------------------
SELECT 'EFFECTIVE SENSITIVE COLUMN PRIVILEGES' AS heading;

SELECT
    role_name,
    table_name,
    column_name,
    has_column_privilege(
        role_name,
        format('public.%I', table_name),
        column_name,
        privilege
    ) AS has_effective_privilege,
    privilege
FROM (
    VALUES
        ('anon', 'businesses', 'owner_email', 'SELECT'),
        ('anon', 'businesses', 'owner_phone', 'SELECT'),
        ('anon', 'businesses', 'owner_id', 'SELECT'),
        ('anon', 'businesses', 'owner_profile_id', 'SELECT'),
        ('authenticated', 'profiles', 'app_role', 'UPDATE'),
        ('authenticated', 'ad_campaigns', 'payment_proof_url', 'SELECT')
) AS checks(role_name, table_name, column_name, privilege);

-- ----------------------------------------------------------------------------
-- 18. PRESENCE OF IMIS_ID COLUMNS IN SCHEMAS
-- ----------------------------------------------------------------------------
SELECT '18. PRESENCE OF IMIS_ID COLUMNS IN SCHEMAS' AS heading;

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

-- ----------------------------------------------------------------------------
-- PUBLIC VIEWS AND MATERIALIZED VIEWS
-- ----------------------------------------------------------------------------
SELECT 'PUBLIC VIEWS AND MATERIALIZED VIEWS' AS heading;

SELECT
    n.nspname AS schema_name,
    c.relname AS object_name,
    CASE c.relkind
        WHEN 'v' THEN 'view'
        WHEN 'm' THEN 'materialized view'
    END AS object_type,
    pg_get_viewdef(c.oid, true) AS definition
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public', 'storage')
  AND c.relkind IN ('v', 'm')
ORDER BY n.nspname, c.relname;

-- ----------------------------------------------------------------------------
-- 19. REALTIME / LOGICAL REPLICATION PUBLICATION MEMBERSHIP
-- ----------------------------------------------------------------------------
SELECT '19. REALTIME / LOGICAL REPLICATION PUBLICATION MEMBERSHIP' AS heading;

SELECT 
    pubname AS publication_name,
    schemaname AS schema_name,
    tablename AS table_name
FROM 
    pg_publication_tables
ORDER BY 
    publication_name, table_name;

-- ----------------------------------------------------------------------------
-- 20. SUPABASE MIGRATION HISTORY
-- ----------------------------------------------------------------------------
SELECT '20. SUPABASE MIGRATION HISTORY' AS heading;

-- Safely inspect schema migration tables and fetch entries
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
