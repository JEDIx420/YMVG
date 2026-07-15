-- ============================================================================
-- YMBD AUDIT SCRIPT 18: EFFECTIVE SENSITIVE COLUMN PRIVILEGES
-- ============================================================================
-- Purpose: Inspect active permission grants (explicit or inherited) on sensitive fields.
-- Expected Output to Export: Table of effective privilege checks.
-- ============================================================================

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
