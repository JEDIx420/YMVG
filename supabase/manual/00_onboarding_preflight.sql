-- YMBD onboarding rollout preflight. Run read-only in Supabase SQL Editor.
-- Stop if any required object/column is reported missing or an assertion fails.

-- 1. Phase 1 migrations 014-017 prerequisites.
SELECT
  EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'app_role' AND e.enumlabel = 'review_admin'
  ) AS review_admin_enum_exists,
  to_regclass('public.role_audit') IS NOT NULL AS role_audit_exists,
  to_regprocedure('public.assign_user_role(uuid,public.app_role)') IS NOT NULL AS assign_user_role_exists,
  to_regprocedure('public.promote_to_business_owner()') IS NOT NULL AS promote_to_business_owner_exists,
  to_regprocedure('public.moderate_campaign(uuid,text)') IS NOT NULL AS moderate_campaign_exists,
  to_regclass('public.public_businesses') IS NOT NULL AS public_businesses_exists,
  to_regprocedure('public.keyword_search_businesses(text,text,text,integer)') IS NOT NULL AS keyword_search_exists,
  to_regprocedure('public.create_my_business(text,text,text,text[],text,text,text,text,text,text,text,text,text,text,text[],text,text,text,text,text,text,text)') IS NOT NULL AS create_my_business_exists;

-- 2. Required profile columns. This result must return zero rows.
WITH required(column_name) AS (
  VALUES
    ('id'), ('user_id'), ('full_name'), ('email'), ('phone'), ('club'),
    ('app_role'), ('created_at'), ('imis_id'), ('ym_region'), ('ym_district'),
    ('ym_zone'), ('ym_club'), ('address'), ('city'), ('state'), ('country'),
    ('education'), ('job_title')
)
SELECT r.column_name AS missing_profile_column
FROM required r
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = 'profiles'
 AND c.column_name = r.column_name
WHERE c.column_name IS NULL;

-- 3. Required business columns. This result must return zero rows.
WITH required(column_name) AS (
  VALUES
    ('id'), ('owner_id'), ('owner_profile_id'), ('owner_name'), ('owner_email'),
    ('owner_phone'), ('brand_name'), ('category'), ('description'), ('services'),
    ('special_offer'), ('address'), ('city'), ('state'), ('country'),
    ('contact_phone'), ('contact_email'), ('website_url'), ('logo_url'),
    ('primary_image_url'), ('gallery_urls'), ('brochure_url'), ('tagline'),
    ('ym_region'), ('ym_zone'), ('ym_district'), ('ym_club'), ('ym_designation'),
    ('sponsorship_tier')
)
SELECT r.column_name AS missing_business_column
FROM required r
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = 'businesses'
 AND c.column_name = r.column_name
WHERE c.column_name IS NULL;

-- 4. Current unrestricted profile trigger definition. Review before continuing.
SELECT
  p.oid::regprocedure AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'handle_new_user';

SELECT
  t.tgname AS trigger_name,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
WHERE t.tgrelid = 'auth.users'::regclass AND NOT t.tgisinternal;

-- 5. Existing-account baseline. Save these results with the deployment record.
SELECT count(*) AS existing_profile_count FROM public.profiles;

SELECT app_role::text AS role, count(*) AS profile_count
FROM public.profiles
GROUP BY app_role
ORDER BY app_role::text;

SELECT count(*) AS super_admin_count
FROM public.profiles
WHERE app_role = 'super_admin'::public.app_role;

-- Normalized email conflicts must be reviewed before activation migration 021.
SELECT lower(btrim(email)) AS normalized_email, count(*) AS profile_count
FROM public.profiles
GROUP BY lower(btrim(email))
HAVING count(*) > 1;

-- 6. No onboarding migration version may already be present in migration history.
DO $$
DECLARE
  conflicting_versions text;
BEGIN
  IF to_regclass('supabase_migrations.schema_migrations') IS NOT NULL THEN
    EXECUTE $query$
      SELECT string_agg(version, ', ' ORDER BY version)
      FROM supabase_migrations.schema_migrations
      WHERE version ~ '(^|_)0?(18|19|20|21|22)($|_)'
    $query$ INTO conflicting_versions;

    IF conflicting_versions IS NOT NULL THEN
      RAISE EXCEPTION 'Conflicting onboarding migration versions already recorded: %', conflicting_versions;
    END IF;
  END IF;
END;
$$;
