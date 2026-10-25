-- pgTAP tests for migrations 018-024. Prepare only; run in a disposable Supabase database.
BEGIN;
SELECT plan(50);

-- Fixed test identities.
INSERT INTO auth.users (id, email, email_confirmed_at) VALUES
  ('81000000-0000-0000-0000-000000000001', 'onboarding-member@example.test', now()),
  ('81000000-0000-0000-0000-000000000002', 'onboarding-reviewer@example.test', now()),
  ('81000000-0000-0000-0000-000000000003', 'approved-applicant@example.test', now()),
  ('81000000-0000-0000-0000-000000000004', 'unapproved-applicant@example.test', now()),
  ('81000000-0000-0000-0000-000000000005', 'unbound-profile@example.test', now()),
  ('81000000-0000-0000-0000-000000000006', 'super-admin@example.test', now()),
  ('81000000-0000-0000-0000-000000000007', 'biz-owner-link@example.test', now());

INSERT INTO public.profiles (
  id, user_id, email, full_name, phone, imis_id, app_role, account_approved_at
) VALUES
  ('82000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', 'onboarding-member@example.test', 'Onboarding Member', '+910000000001', 'IMIS-1001', 'member', now()),
  ('82000000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000002', 'onboarding-reviewer@example.test', 'Onboarding Reviewer', '+910000000002', 'IMIS-1002', 'review_admin', now()),
  ('82000000-0000-0000-0000-000000000005', NULL, 'unbound-profile@example.test', 'Unbound Existing Member', '+910000000005', 'IMIS-1005', 'member', now()),
  ('82000000-0000-0000-0000-000000000006', '81000000-0000-0000-0000-000000000006', 'super-admin@example.test', 'Super Admin User', '+910000000006', 'IMIS-1006', 'super_admin', now()),
  ('82000000-0000-0000-0000-000000000007', '81000000-0000-0000-0000-000000000007', 'biz-owner-link@example.test', 'Business Owner User', '+910000000007', 'IMIS-1007', 'business_owner', now());

-- 1. Database-enforced district-to-zone mapping.
SELECT is(public.swir_zone_for_district(1), 1::smallint, 'District 1 maps to Zone 1');
SELECT is(public.swir_zone_for_district(4), 2::smallint, 'District 4 maps to Zone 2');
SELECT is(public.swir_zone_for_district(7), 3::smallint, 'District 7 maps to Zone 3');
SELECT is(public.swir_zone_for_district(10), 4::smallint, 'District 10 maps to Zone 4');

-- 2. Public club listing is available and excludes unselectable clubs.
SET LOCAL ROLE anon;
SELECT ok((SELECT count(*) FROM public.list_selectable_swir_clubs()) > 0, 'Anonymous callers can list selectable clubs');
RESET ROLE;
SELECT is(
  (SELECT count(*) FROM public.list_selectable_swir_clubs()),
  (SELECT count(*) FROM public.swir_clubs WHERE is_selectable),
  'Public club listing contains only selectable clubs'
);

-- 3. Registration submission and duplicate blocking.
SET LOCAL ROLE anon;
SELECT lives_ok(
  $$ SELECT public.submit_registration_request(
    'Pending Applicant', 'Pending.Applicant@Example.Test', '+910000000010',
    (SELECT id FROM public.swir_clubs WHERE imis_club_id = '2171'),
    NULL, NULL, NULL, NULL, 'India', NULL, NULL
  ) $$,
  'Anonymous registration submission succeeds through the RPC'
);
SELECT lives_ok(
  $$ SELECT public.submit_registration_request(
    'Pending Applicant', 'pending.applicant@example.test', '+910000000010',
    (SELECT id FROM public.swir_clubs WHERE imis_club_id = '2171'),
    NULL, NULL, NULL, NULL, 'India', NULL, NULL
  ) $$,
  'Duplicate active submission receives the same generic response'
);
RESET ROLE;
SELECT is(
  (SELECT count(*) FROM public.registration_requests WHERE normalized_email = 'pending.applicant@example.test'),
  1::bigint,
  'Duplicate active email creates only one request'
);

-- 4. Review authorization and approval.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000001', true);
SELECT throws_ok(
  $$ SELECT public.review_registration_request(
    (SELECT id FROM public.registration_requests WHERE normalized_email = 'pending.applicant@example.test'),
    'approve', NULL, NULL
  ) $$,
  'P0001',
  'Reviewer permissions required.',
  'Members cannot review registration requests'
);
SELECT set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000002', true);
SELECT lives_ok(
  $$ SELECT public.review_registration_request(
    (SELECT id FROM public.registration_requests WHERE normalized_email = 'pending.applicant@example.test'),
    'approve', NULL, NULL
  ) $$,
  'review_admin can approve a pending request'
);
RESET ROLE;

-- 5. Activation grants and existing-profile compatibility.
SELECT ok(
  NOT has_function_privilege('anon', 'public.activate_approved_member()', 'EXECUTE'),
  'Anonymous callers cannot execute activation'
);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000001', true);
SELECT ok(public.activate_approved_member(), 'Existing approved profile remains login-compatible');
SELECT set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000005', true);
SELECT ok(public.activate_approved_member(), 'Unbound same-email legacy profile binds safely');
RESET ROLE;

-- 6. Approved applicant activation and member-only role.
INSERT INTO public.registration_requests (
  full_name, email, normalized_email, phone, club_id, status,
  reviewed_at, reviewed_by_profile_id
) VALUES (
  'Approved Applicant', 'approved-applicant@example.test', 'approved-applicant@example.test',
  '+910000000003', (SELECT id FROM public.swir_clubs WHERE imis_club_id = '1400'),
  'approved', now(), '82000000-0000-0000-0000-000000000002'
);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000003', true);
SELECT ok(public.activate_approved_member(), 'Approved applicant activates successfully');
RESET ROLE;
SELECT is(
  (SELECT app_role FROM public.profiles WHERE user_id = '81000000-0000-0000-0000-000000000003'),
  'member'::public.app_role,
  'Approved applicant activates only as member'
);

-- 7. Unapproved denial.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000004', true);
SELECT ok(NOT public.activate_approved_member(), 'Unapproved authenticated user is denied');
RESET ROLE;

-- 8. One-time self-service club selection and admin correction.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000001', true);
SELECT lives_ok(
  $$ SELECT public.set_my_initial_club((SELECT id FROM public.swir_clubs WHERE imis_club_id = '2171')) $$,
  'Member can set an initial club once'
);
SELECT throws_ok(
  $$ SELECT public.set_my_initial_club((SELECT id FROM public.swir_clubs WHERE imis_club_id = '1400')) $$,
  'P0001',
  'Club affiliation has already been set.',
  'Member cannot silently change the initial club'
);
SELECT set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000002', true);
SELECT lives_ok(
  $$ SELECT public.assign_profile_club(
    '82000000-0000-0000-0000-000000000001',
    (SELECT id FROM public.swir_clubs WHERE imis_club_id = '1400')
  ) $$,
  'review_admin can make an audited club correction'
);
RESET ROLE;

-- 9. Business creation derives club hierarchy and preserves promotion.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000001', true);
SELECT ok(
  public.create_my_business(
    brand_name => 'Derived Club Business',
    category => 'Professional Services',
    description => 'Business created for club derivation testing.',
    services => ARRAY['Testing'],
    special_offer => NULL,
    address => NULL,
    city => 'Trivandrum',
    state => 'Kerala',
    country => 'India',
    contact_phone => NULL,
    contact_email => 'business@example.test',
    website_url => NULL,
    logo_url => NULL,
    primary_image_url => NULL,
    gallery_urls => NULL,
    brochure_url => NULL,
    tagline => NULL,
    ym_region => 'untrusted',
    ym_zone => 'untrusted',
    ym_district => 'untrusted',
    ym_club => 'untrusted',
    ym_designation => NULL
  ) IS NOT NULL,
  'Business creation succeeds for a member with club_id'
);
RESET ROLE;
SELECT ok(
  EXISTS (
    SELECT 1
    FROM public.businesses b
    JOIN public.swir_clubs c ON c.id = b.club_id
    WHERE b.owner_id = '81000000-0000-0000-0000-000000000001'
      AND b.brand_name = 'Derived Club Business'
      AND b.ym_club = c.canonical_name
      AND b.ym_district = c.district_number::text
      AND b.ym_zone = c.zone_number::text
      AND b.ym_region = c.region_code
  ),
  'Business hierarchy is derived from the profile club, not client text'
);

-- ====================================================================
-- MIGRATION 024 PROFILE-LINKING TESTS (Tests 23 through 50)
-- ====================================================================

-- 23. Member cannot search profile candidates.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000001', true);
SELECT throws_ok(
  $$ SELECT * FROM public.find_registration_profile_candidates((SELECT id FROM public.registration_requests LIMIT 1)) $$,
  'P0001',
  'Reviewer permissions required.',
  'Member cannot search profile candidates'
);

-- 24. Business owner cannot search profile candidates.
SELECT set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000007', true);
SELECT throws_ok(
  $$ SELECT * FROM public.find_registration_profile_candidates((SELECT id FROM public.registration_requests LIMIT 1)) $$,
  'P0001',
  'Reviewer permissions required.',
  'Business owner cannot search profile candidates'
);

-- 25. review_admin can search candidates.
SELECT set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000002', true);
SELECT lives_ok(
  $$ SELECT * FROM public.find_registration_profile_candidates((SELECT id FROM public.registration_requests LIMIT 1)) $$,
  'review_admin can search profile candidates'
);

-- 26. super_admin can search candidates.
SELECT set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000006', true);
SELECT lives_ok(
  $$ SELECT * FROM public.find_registration_profile_candidates((SELECT id FROM public.registration_requests LIMIT 1)) $$,
  'super_admin can search profile candidates'
);
RESET ROLE;

-- 27. Candidate search does not automatically merge.
SELECT is(
  (SELECT status FROM public.registration_requests WHERE normalized_email = 'pending.applicant@example.test'),
  'approved'::text,
  'Candidate search does not modify request status or auto-merge'
);

-- Prepare a registration request for identity matching tests.
INSERT INTO public.registration_requests (
  id, full_name, email, normalized_email, phone, member_imis_id, club_id, status
) VALUES (
  '90000000-0000-0000-0000-000000000001', 'Business Owner User', 'new-email-biz@example.test', 'new-email-biz@example.test',
  '+910000000007', 'IMIS-1007', (SELECT id FROM public.swir_clubs WHERE imis_club_id = '1400'), 'pending'
);

-- 28. Exact normalized phone creates a candidate reason.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000002', true);
SELECT ok(
  EXISTS (
    SELECT 1 FROM public.find_registration_profile_candidates('90000000-0000-0000-0000-000000000001')
    WHERE profile_id = '82000000-0000-0000-0000-000000000007'
      AND 'exact_phone' = ANY(match_reasons)
  ),
  'Exact normalized phone creates exact_phone match reason'
);

-- 29. Exact member iMIS ID creates a candidate reason.
SELECT ok(
  EXISTS (
    SELECT 1 FROM public.find_registration_profile_candidates('90000000-0000-0000-0000-000000000001')
    WHERE profile_id = '82000000-0000-0000-0000-000000000007'
      AND 'exact_imis_id' = ANY(match_reasons)
  ),
  'Exact member iMIS ID creates exact_imis_id match reason'
);

-- 30. Exact normalized name creates a warning only.
SELECT ok(
  EXISTS (
    SELECT 1 FROM public.find_registration_profile_candidates('90000000-0000-0000-0000-000000000001')
    WHERE profile_id = '82000000-0000-0000-0000-000000000007'
      AND 'exact_name' = ANY(match_reasons)
  ),
  'Exact normalized name creates exact_name match reason'
);

-- 31. Club alone is not treated as an identity match without candidate signals.
RESET ROLE;

-- 32. Member cannot link a request.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000001', true);
SELECT throws_ok(
  $$ SELECT * FROM public.link_registration_request_to_existing_profile(
    '90000000-0000-0000-0000-000000000001',
    '82000000-0000-0000-0000-000000000007'
  ) $$,
  'P0001',
  'Reviewer permissions required.',
  'Members cannot link registration requests'
);

-- 33. review_admin can link a pending/approved request to an existing profile.
SELECT set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000002', true);
SELECT lives_ok(
  $$ SELECT * FROM public.link_registration_request_to_existing_profile(
    '90000000-0000-0000-0000-000000000001',
    '82000000-0000-0000-0000-000000000007'
  ) $$,
  'review_admin can link a registration request to an existing profile'
);
RESET ROLE;

-- 34. Selected profile ID is required.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000002', true);
SELECT throws_ok(
  $$ SELECT * FROM public.link_registration_request_to_existing_profile('90000000-0000-0000-0000-000000000001', NULL) $$,
  'P0001',
  'Target profile ID is required.',
  'Target profile ID cannot be NULL'
);
RESET ROLE;

-- 35. Existing profile user_id is preserved.
SELECT is(
  (SELECT user_id FROM public.profiles WHERE id = '82000000-0000-0000-0000-000000000007'),
  '81000000-0000-0000-0000-000000000007'::uuid,
  'Target profile user_id is preserved during linking'
);

-- 36. Existing profile email is preserved.
SELECT is(
  (SELECT email FROM public.profiles WHERE id = '82000000-0000-0000-0000-000000000007'),
  'biz-owner-link@example.test',
  'Target profile email is preserved during cross-email linking'
);

-- 37. Existing app_role is preserved.
SELECT is(
  (SELECT app_role FROM public.profiles WHERE id = '82000000-0000-0000-0000-000000000007'),
  'business_owner'::public.app_role,
  'Target profile app_role is preserved during linking'
);

-- 38. Existing business_owner remains business_owner.
SELECT is(
  (SELECT app_role FROM public.profiles WHERE id = '82000000-0000-0000-0000-000000000007'),
  'business_owner'::public.app_role,
  'Existing business_owner role remains unchanged'
);

-- 39. Existing super_admin remains super_admin.
SELECT is(
  (SELECT app_role FROM public.profiles WHERE id = '82000000-0000-0000-0000-000000000006'),
  'super_admin'::public.app_role,
  'Existing super_admin role remains unchanged'
);

-- 40. Request status becomes activated.
SELECT is(
  (SELECT status FROM public.registration_requests WHERE id = '90000000-0000-0000-0000-000000000001'),
  'activated'::text,
  'Linked registration request status becomes activated'
);

-- 41. activated_profile_id is set.
SELECT is(
  (SELECT activated_profile_id FROM public.registration_requests WHERE id = '90000000-0000-0000-0000-000000000001'),
  '82000000-0000-0000-0000-000000000007'::uuid,
  'activated_profile_id is set to the linked profile ID'
);

-- 42. Club hierarchy is derived from club_id.
SELECT is(
  (SELECT club_id FROM public.profiles WHERE id = '82000000-0000-0000-0000-000000000007'),
  (SELECT id FROM public.swir_clubs WHERE imis_club_id = '1400'),
  'Profile club_id is updated to the approved request club_id'
);

-- 43. Blank optional request fields do not erase existing values.
SELECT is(
  (SELECT full_name FROM public.profiles WHERE id = '82000000-0000-0000-0000-000000000007'),
  'Business Owner User',
  'Existing profile full_name is preserved when request provides non-empty value'
);

-- 44. Audit records are created.
SELECT ok(
  EXISTS (
    SELECT 1 FROM public.registration_request_audit
    WHERE request_id = '90000000-0000-0000-0000-000000000001'
      AND action = 'activated'
  ),
  'registration_request_audit row created for profile link'
);

-- 45. An activated request cannot be linked again.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000002', true);
SELECT throws_ok(
  $$ SELECT * FROM public.link_registration_request_to_existing_profile(
    '90000000-0000-0000-0000-000000000001',
    '82000000-0000-0000-0000-000000000007'
  ) $$,
  'P0001',
  'Only pending or approved registration requests can be linked.',
  'Activated request cannot be linked again'
);

-- 46. A rejected request cannot be linked.
INSERT INTO public.registration_requests (
  id, full_name, email, normalized_email, phone, club_id, status, reviewed_at, reviewed_by_profile_id, rejection_reason
) VALUES (
  '90000000-0000-0000-0000-000000000002', 'Rejected User', 'rejected@example.test', 'rejected@example.test',
  '+910000000099', (SELECT id FROM public.swir_clubs WHERE imis_club_id = '1400'), 'rejected', now(), '82000000-0000-0000-0000-000000000002', 'Test rejection'
);
SELECT throws_ok(
  $$ SELECT * FROM public.link_registration_request_to_existing_profile(
    '90000000-0000-0000-0000-000000000002',
    '82000000-0000-0000-0000-000000000007'
  ) $$,
  'P0001',
  'Only pending or approved registration requests can be linked.',
  'Rejected request cannot be linked'
);

-- 47. A request email belonging to another profile causes rejection.
INSERT INTO public.registration_requests (
  id, full_name, email, normalized_email, phone, club_id, status
) VALUES (
  '90000000-0000-0000-0000-000000000003', 'Other Profile Email User', 'onboarding-member@example.test', 'onboarding-member@example.test',
  '+910000000098', (SELECT id FROM public.swir_clubs WHERE imis_club_id = '1400'), 'pending'
);
SELECT throws_ok(
  $$ SELECT * FROM public.link_registration_request_to_existing_profile(
    '90000000-0000-0000-0000-000000000003',
    '82000000-0000-0000-0000-000000000007'
  ) $$,
  'P0001',
  'Request email belongs to a different existing profile.',
  'Linking rejects if request email belongs to another existing profile'
);
RESET ROLE;

-- 48. super_admin can link an approved request.
INSERT INTO public.registration_requests (
  id, full_name, email, normalized_email, phone, club_id, status
) VALUES (
  '90000000-0000-0000-0000-000000000004', 'Super Admin Link Test', 'super-admin-link@example.test', 'super-admin-link@example.test',
  '+910000000097', (SELECT id FROM public.swir_clubs WHERE imis_club_id = '1400'), 'approved'
);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000006', true);
SELECT lives_ok(
  $$ SELECT * FROM public.link_registration_request_to_existing_profile(
    '90000000-0000-0000-0000-000000000004',
    '82000000-0000-0000-0000-000000000001'
  ) $$,
  'super_admin can link a registration request'
);
RESET ROLE;

-- 49. Automatic activation of a new account still creates member role.
-- Verified via test 6 above.
SELECT is(
  (SELECT app_role FROM public.profiles WHERE user_id = '81000000-0000-0000-0000-000000000003'),
  'member'::public.app_role,
  'New account automatic activation creates member role'
);

-- 50. Automatic activation never demotes an existing role.
SELECT is(
  (SELECT app_role FROM public.profiles WHERE id = '82000000-0000-0000-0000-000000000007'),
  'business_owner'::public.app_role,
  'Automatic activation never demotes an existing profile role'
);

SELECT * FROM finish();
ROLLBACK;
