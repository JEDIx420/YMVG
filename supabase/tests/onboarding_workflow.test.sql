-- pgTAP tests for migrations 018-022. Prepare only; run in a disposable Supabase database.
BEGIN;
SELECT plan(22);

-- Fixed test identities.
INSERT INTO auth.users (id, email, email_confirmed_at) VALUES
  ('81000000-0000-0000-0000-000000000001', 'onboarding-member@example.test', now()),
  ('81000000-0000-0000-0000-000000000002', 'onboarding-reviewer@example.test', now()),
  ('81000000-0000-0000-0000-000000000003', 'approved-applicant@example.test', now()),
  ('81000000-0000-0000-0000-000000000004', 'unapproved-applicant@example.test', now()),
  ('81000000-0000-0000-0000-000000000005', 'unbound-profile@example.test', now());

INSERT INTO public.profiles (
  id, user_id, email, full_name, phone, app_role, account_approved_at
) VALUES
  ('82000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', 'onboarding-member@example.test', 'Onboarding Member', '+910000000001', 'member', now()),
  ('82000000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000002', 'onboarding-reviewer@example.test', 'Onboarding Reviewer', '+910000000002', 'review_admin', now()),
  ('82000000-0000-0000-0000-000000000005', NULL, 'unbound-profile@example.test', 'Unbound Existing Member', '+910000000005', 'member', now());

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

SELECT * FROM finish();
ROLLBACK;
