-- YMBD Read-Only Verification Script for Reviewer Profile Linking (Migration 024)
-- This script performs schema and permission audits for reviewer profile-linking RPCs.
-- It does not mutate data or hardcode real member details.

SELECT
  to_regprocedure('public.find_registration_profile_candidates(uuid,text)') IS NOT NULL AS candidate_rpc_exists,
  to_regprocedure('public.link_registration_request_to_existing_profile(uuid,uuid)') IS NOT NULL AS link_rpc_exists,
  has_function_privilege('anon', 'public.find_registration_profile_candidates(uuid,text)', 'EXECUTE') AS anon_can_find_candidates,
  has_function_privilege('anon', 'public.link_registration_request_to_existing_profile(uuid,uuid)', 'EXECUTE') AS anon_can_link_profile,
  has_function_privilege('authenticated', 'public.find_registration_profile_candidates(uuid,text)', 'EXECUTE') AS auth_can_find_candidates,
  has_function_privilege('authenticated', 'public.link_registration_request_to_existing_profile(uuid,uuid)', 'EXECUTE') AS auth_can_link_profile;

-- Audit check: verify linked registration requests have activated_profile_id set
SELECT
  r.id AS request_id,
  r.normalized_email AS request_email,
  r.status,
  r.activated_profile_id,
  p.email AS profile_email,
  p.app_role AS profile_role,
  c.canonical_name AS club_name
FROM public.registration_requests r
JOIN public.profiles p ON p.id = r.activated_profile_id
LEFT JOIN public.swir_clubs c ON c.id = p.club_id
WHERE r.status = 'activated'
ORDER BY r.submitted_at DESC
LIMIT 10;

-- Audit check: verify registration_request_audit entries for linking events
SELECT
  a.id AS audit_id,
  a.request_id,
  a.action,
  a.previous_status,
  a.new_status,
  a.actor_profile_id,
  a.reason,
  a.created_at
FROM public.registration_request_audit a
WHERE a.action = 'activated'
ORDER BY a.created_at DESC
LIMIT 10;

/*
====================================================================
EXAMPLE REVIEWER INVOCATION (SQL / RPC)
====================================================================

To manually invoke candidate profile search as a review_admin or super_admin:

  SELECT * FROM public.find_registration_profile_candidates(
    '00000000-0000-0000-0000-000000000000'::uuid, -- request_id
    'Search Name or Phone'                       -- optional search text
  );

To manually execute reviewer profile linking for an approved/pending request:

  SELECT * FROM public.link_registration_request_to_existing_profile(
    '00000000-0000-0000-0000-000000000000'::uuid, -- request_id
    '11111111-1111-1111-1111-111111111111'::uuid  -- target profile_id to preserve
  );

====================================================================
*/
