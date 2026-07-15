-- Run after 020_registration_requests.sql and 021_approved_member_activation.sql.

SELECT
  to_regclass('public.registration_requests') IS NOT NULL AS registration_requests_exists,
  to_regclass('public.registration_request_audit') IS NOT NULL AS registration_audit_exists,
  to_regclass('public.onboarding_auth_audit') IS NOT NULL AS auth_audit_exists,
  to_regprocedure('public.submit_registration_request(text,text,text,uuid,text,text,text,text,text,text,text)') IS NOT NULL AS submission_rpc_exists,
  to_regprocedure('public.review_registration_request(uuid,text,text,uuid)') IS NOT NULL AS review_rpc_exists,
  to_regprocedure('public.activate_approved_member()') IS NOT NULL AS activation_rpc_exists;

SELECT c.relname, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('registration_requests', 'registration_request_audit', 'onboarding_auth_audit')
ORDER BY c.relname;

SELECT
  has_table_privilege('anon', 'public.registration_requests', 'INSERT') AS anon_direct_insert,
  has_table_privilege('anon', 'public.registration_requests', 'SELECT') AS anon_direct_select,
  has_table_privilege('anon', 'public.registration_requests', 'UPDATE') AS anon_direct_update,
  has_table_privilege('anon', 'public.registration_requests', 'DELETE') AS anon_direct_delete;

SELECT
  has_function_privilege('anon', 'public.submit_registration_request(text,text,text,uuid,text,text,text,text,text,text,text)', 'EXECUTE') AS anon_can_submit,
  has_function_privilege('anon', 'public.review_registration_request(uuid,text,text,uuid)', 'EXECUTE') AS anon_can_review,
  has_function_privilege('authenticated', 'public.review_registration_request(uuid,text,text,uuid)', 'EXECUTE') AS authenticated_can_call_review_gate,
  has_function_privilege('authenticated', 'public.activate_approved_member()', 'EXECUTE') AS authenticated_can_call_activation,
  has_function_privilege('anon', 'public.activate_approved_member()', 'EXECUTE') AS anon_can_call_activation;

SELECT policyname, tablename, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('registration_requests', 'registration_request_audit', 'onboarding_auth_audit')
ORDER BY tablename, policyname;

-- Existing users are recognized when this count is zero.
SELECT count(*) AS existing_profiles_missing_approval_marker
FROM public.profiles
WHERE account_approved_at IS NULL;

SELECT status, count(*) AS request_count
FROM public.registration_requests
GROUP BY status
ORDER BY status;
