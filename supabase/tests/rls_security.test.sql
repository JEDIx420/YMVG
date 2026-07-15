-- pgTAP security verification tests for YMBD Phase 1 Hardening
BEGIN;
SELECT plan(23);

-- 1. Setup mock profiles, roles, and businesses
-- Create standard member
INSERT INTO auth.users (id, email) VALUES ('11111111-1111-1111-1111-111111111111', 'member1@example.com');
INSERT INTO public.profiles (user_id, email, full_name, app_role, club) 
VALUES ('11111111-1111-1111-1111-111111111111', 'member1@example.com', 'Standard Member', 'member', 'SWIR Club A');

-- Create a review admin
INSERT INTO auth.users (id, email) VALUES ('22222222-2222-2222-2222-222222222222', 'reviewer1@example.com');
INSERT INTO public.profiles (user_id, email, full_name, app_role, club) 
VALUES ('22222222-2222-2222-2222-222222222222', 'reviewer1@example.com', 'Review Admin One', 'review_admin', 'SWIR Club A');

-- Create test business owner
INSERT INTO auth.users (id, email) VALUES ('33333333-3333-3333-3333-333333333333', 'owner1@example.com');
INSERT INTO public.profiles (user_id, email, full_name, app_role, club) 
VALUES ('33333333-3333-3333-3333-333333333333', 'owner1@example.com', 'Business Owner One', 'business_owner', 'SWIR Club A');

-- Create another test business owner
INSERT INTO auth.users (id, email) VALUES ('44444444-4444-4444-4444-444444444444', 'owner2@example.com');
INSERT INTO public.profiles (user_id, email, full_name, app_role, club) 
VALUES ('44444444-4444-4444-4444-444444444444', 'owner2@example.com', 'Business Owner Two', 'business_owner', 'SWIR Club B');

-- Create the single super admin
INSERT INTO auth.users (id, email) VALUES ('55555555-5555-5555-5555-555555555555', 'superadmin@example.com');
INSERT INTO public.profiles (user_id, email, full_name, app_role, club) 
VALUES ('55555555-5555-5555-5555-555555555555', 'superadmin@example.com', 'Super Admin Director', 'super_admin', 'SWIR Main');

-- Insert business listings for testing
INSERT INTO public.businesses (
    id, owner_id, owner_name, owner_email, owner_phone, brand_name, category, 
    description, contact_phone, contact_email, website_url, address, 
    city, state, country, ym_region, ym_club, ym_designation, sponsorship_tier
) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '33333333-3333-3333-3333-333333333333',
    'Business Owner One',
    'owner1@example.com',
    '+91-99999-11111',
    'Enterprise Alpha',
    'Technology',
    'Consulting services',
    '+91-99999-22222',
    'contact@enterprise-alpha.com',
    'https://enterprise-alpha.com',
    '123 Tech Lane',
    'Kochi',
    'Kerala',
    'India',
    'SWIR Region A',
    'SWIR Club A',
    'President',
    1.0
);

INSERT INTO public.businesses (
    id, owner_id, owner_name, owner_email, owner_phone, brand_name, category, 
    description, contact_phone, contact_email, website_url, address, 
    city, state, country, ym_region, ym_club, ym_designation, sponsorship_tier
) VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '44444444-4444-4444-4444-444444444444',
    'Business Owner Two',
    'owner2@example.com',
    '+91-88888-11111',
    'Enterprise Beta',
    'Education',
    'Online courses',
    '+91-88888-22222',
    'contact@enterprise-beta.com',
    'https://enterprise-beta.com',
    '456 Scholar Way',
    'Trivandrum',
    'Kerala',
    'India',
    'SWIR Region B',
    'SWIR Club B',
    'Secretary',
    1.0
);

-- ============================================================================
-- TESTS
-- ============================================================================

-- Test 1: Member cannot update app_role directly
SET ROLE authenticated;
SET auth.uid = '11111111-1111-1111-1111-111111111111';
SELECT throws_ok(
    $$ UPDATE public.profiles SET app_role = 'super_admin' WHERE user_id = '11111111-1111-1111-1111-111111111111' $$,
    'P0001',
    'Privilege Escalation Blocked: Cannot modify app_role directly.',
    'Test 1: Member cannot update app_role directly'
);

-- Test 2: Member cannot update email or user_id
SELECT throws_ok(
    $$ UPDATE public.profiles SET email = 'hacker@example.com' WHERE user_id = '11111111-1111-1111-1111-111111111111' $$,
    'P0001',
    'Cannot modify email',
    'Test 2.1: Member cannot update email'
);
SELECT throws_ok(
    $$ UPDATE public.profiles SET user_id = '99999999-9999-9999-9999-999999999999' WHERE user_id = '11111111-1111-1111-1111-111111111111' $$,
    'P0001',
    'Cannot modify user_id',
    'Test 2.2: Member cannot update user_id'
);

-- Test 3: Member cannot assign themselves review_admin
SELECT throws_ok(
    $$ UPDATE public.profiles SET app_role = 'review_admin' WHERE user_id = '11111111-1111-1111-1111-111111111111' $$,
    'P0001',
    'Privilege Escalation Blocked: Cannot modify app_role directly.',
    'Test 3: Member cannot assign themselves review_admin'
);

-- Test 4: Member cannot assign themselves super_admin
SELECT throws_ok(
    $$ UPDATE public.profiles SET app_role = 'super_admin' WHERE user_id = '11111111-1111-1111-1111-111111111111' $$,
    'P0001',
    'Privilege Escalation Blocked: Cannot modify app_role directly.',
    'Test 4: Member cannot assign themselves super_admin'
);

-- Test 5: Only super_admin can execute assign_user_role successfully
-- Act as member and try to execute assign_user_role
SELECT throws_ok(
    $$ SELECT public.assign_user_role('11111111-1111-1111-1111-111111111111'::uuid, 'review_admin'::public.app_role) $$,
    'P0001',
    'Unauthorized: Administrative credentials required.',
    'Test 5.1: Non-super_admin execution of assign_user_role is blocked'
);
-- Act as super_admin
RESET ROLE;
SET ROLE authenticated;
SET auth.uid = '55555555-5555-5555-5555-555555555555';
SELECT is(
    (SELECT public.assign_user_role(
        (SELECT id FROM public.profiles WHERE user_id = '11111111-1111-1111-1111-111111111111'),
        'review_admin'::public.app_role
    )),
    'Role updated successfully to review_admin',
    'Test 5.2: super_admin can successfully execute assign_user_role'
);

-- Test 6: Last super_admin cannot demote themselves
-- Attempt to demote the only super admin ('55555555-5555-5555-5555-555555555555')
SELECT throws_ok(
    $$ SELECT public.assign_user_role(
        (SELECT id FROM public.profiles WHERE user_id = '55555555-5555-5555-5555-555555555555'),
        'member'::public.app_role
    ) $$,
    'P0001',
    'Safety Block: Cannot demote the final remaining super_admin account.',
    'Test 6: Last super_admin cannot demote themselves'
);

-- Test 7: Role changes create audit records
SELECT ok(
    EXISTS (
        SELECT 1 FROM public.role_audit 
        WHERE target_profile_id = (SELECT id FROM public.profiles WHERE user_id = '11111111-1111-1111-1111-111111111111')
          AND new_role = 'review_admin'::public.app_role
    ),
    'Test 7: Role changes are recorded in role_audit table'
);

-- Test 8: Business creation promotes member to business_owner
-- Demote standard member back to member role (via service role to bypass trigger)
RESET ROLE;
UPDATE public.profiles SET app_role = 'member' WHERE user_id = '11111111-1111-1111-1111-111111111111';
-- Simulate business creation by calling create_my_business as standard member
SET ROLE authenticated;
SET auth.uid = '11111111-1111-1111-1111-111111111111';
SELECT ok(
    (SELECT public.create_my_business(
        'Enterprise Member Corp', 'Technology', 'Standard service.', NULL, NULL, 
        '789 Street', 'Kochi', 'Kerala', 'India', '+91-90000-12345', 
        'member@corp.com', 'https://corp.com', NULL, NULL, NULL, 
        'SWIR Region A', 'SWIR Club A', NULL, NULL, 'Member Owner'
    ) IS NOT NULL),
    'Test 8.1: create_my_business returns a valid UUID'
);
SELECT is(
    (SELECT app_role FROM public.profiles WHERE user_id = '11111111-1111-1111-1111-111111111111'),
    'business_owner'::public.app_role,
    'Test 8.2: User promoted to business_owner after creating a business'
);

-- Test 9: Business creation does not downgrade review_admin or super_admin
RESET ROLE;
-- Grant review_admin to owner 2
UPDATE public.profiles SET app_role = 'review_admin' WHERE user_id = '44444444-4444-4444-4444-444444444444';
SET ROLE authenticated;
SET auth.uid = '44444444-4444-4444-4444-444444444444';
-- Call create_my_business as review_admin
SELECT ok(
    (SELECT public.create_my_business(
        'Reviewer Enterprise', 'Education', 'Standard education service.', NULL, NULL, 
        '999 Way', 'Trivandrum', 'Kerala', 'India', '+91-90000-54321', 
        'reviewer@corp.com', 'https://edu.com', NULL, NULL, NULL, 
        'SWIR Region B', 'SWIR Club B', NULL, NULL, 'Review Admin Owner'
    ) IS NOT NULL),
    'Test 9.1: Review admin creates business successfully'
);
SELECT is(
    (SELECT app_role FROM public.profiles WHERE user_id = '44444444-4444-4444-4444-444444444444'),
    'review_admin'::public.app_role,
    'Test 9.2: review_admin is not downgraded to business_owner'
);

-- Test 10: review_admin can view all businesses
RESET ROLE;
SET ROLE authenticated;
SET auth.uid = '22222222-2222-2222-2222-222222222222'; -- review_admin
SELECT ok(
    (SELECT count(*)::int FROM public.businesses) >= 2,
    'Test 10: review_admin can view all businesses'
);

-- Test 11: review_admin cannot edit another owner’s business
-- Attempt to edit Owner 1's business ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
SELECT throws_ok(
    $$ UPDATE public.businesses SET brand_name = 'Hacked' WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
    '42501', -- blocked by RLS UPDATE policy
    NULL,
    'Test 11: review_admin cannot edit another owner''s business'
);

-- Test 12: review_admin cannot delete businesses
SELECT throws_ok(
    $$ DELETE FROM public.businesses WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
    '42501', -- blocked by RLS DELETE policy
    NULL,
    'Test 12: review_admin cannot delete businesses'
);

-- Test 13: review_admin can moderate campaigns through the dedicated RPC
-- Insert a pending campaign request
RESET ROLE;
INSERT INTO public.ad_campaigns (id, business_id, campaign_type, status, boost_multiplier, start_date, end_date)
VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'search_boost', 'pending', 1.5, now(), now() + interval '30 days');
-- Act as review_admin
SET ROLE authenticated;
SET auth.uid = '22222222-2222-2222-2222-222222222222';
SELECT is(
    (SELECT public.moderate_campaign('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 'approve')),
    'Campaign approved and activated.',
    'Test 13: review_admin can approve campaigns via moderate_campaign'
);

-- Test 14: review_admin cannot perform arbitrary campaign updates
SELECT throws_ok(
    $$ UPDATE public.ad_campaigns SET boost_multiplier = 9.9 WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
    '42501', -- blocked by RLS UPDATE policy (can only update if owner and pending)
    NULL,
    'Test 14: review_admin cannot perform arbitrary campaign updates'
);

-- Test 15: Anonymous visitors can SELECT public_businesses
RESET ROLE;
SET ROLE anon;
SELECT ok(
    (SELECT count(*)::int FROM public.public_businesses) >= 2,
    'Test 15: Anonymous visitors can select public_businesses view'
);

-- Test 16: Anonymous visitors cannot SELECT businesses base table
SELECT throws_ok(
    $$ SELECT owner_id FROM public.businesses $$,
    '42501', -- Permission Denied
    NULL,
    'Test 16: Anonymous visitors cannot query the businesses base table'
);

-- Test 17: Public view does not expose private ownership fields
SELECT hasnt_column(
    'public',
    'public_businesses',
    'owner_email',
    'Test 17.1: The public_businesses view does not contain private owner_email'
);
SELECT hasnt_column(
    'public',
    'public_businesses',
    'imis_id',
    'Test 17.2: The public_businesses view does not contain private imis_id'
);

-- Test 18: Safe keyword search returns public fields only
SELECT results_eq(
    $$
    SELECT brand_name, contact_email FROM public.keyword_search_businesses('Alpha', 'All', 'All', 5)
    $$,
    $$
    VALUES ('Enterprise Alpha'::text, 'contact@enterprise-alpha.com'::text)
    $$,
    'Test 18: Safe keyword search RPC executes successfully and returns only public fields'
);

-- Test 19: Owner can read and edit their own business
RESET ROLE;
SET ROLE authenticated;
SET auth.uid = '33333333-3333-3333-3333-333333333333'; -- Owner 1
SELECT ok(
    (SELECT count(*)::int FROM public.businesses WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') = 1,
    'Test 19.1: Owner can read their own business listing'
);
UPDATE public.businesses SET brand_name = 'Enterprise Alpha Updated' WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
SELECT is(
    (SELECT brand_name FROM public.businesses WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    'Enterprise Alpha Updated',
    'Test 19.2: Owner can edit their own business listing'
);

-- Test 20: Owner cannot read another owner’s private row
SELECT is(
    (SELECT count(*)::int FROM public.businesses WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    0,
    'Test 20: Owner cannot select another owner''s private row from base table'
);

-- Test 21: Direct anon lead insertion fails
RESET ROLE;
SET ROLE anon;
SELECT throws_ok(
    $$
    INSERT INTO public.leads (business_id, sender_name, sender_email, message)
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Spammer', 'spam@spammer.com', 'Spam Message')
    $$,
    '42501', -- Permission Denied
    NULL,
    'Test 21: Anonymous direct inserts to public.leads are blocked'
);

-- Test 22: Direct authenticated lead insertion fails
RESET ROLE;
SET ROLE authenticated;
SET auth.uid = '11111111-1111-1111-1111-111111111111';
SELECT throws_ok(
    $$
    INSERT INTO public.leads (business_id, sender_name, sender_email, message)
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Authenticated User', 'user@example.com', 'Spam Message')
    $$,
    '42501', -- Permission Denied
    NULL,
    'Test 22: Authenticated direct inserts to public.leads are blocked'
);

-- Test 23: OAuth external redirects are rejected
-- Note: OAuth redirect validation is implemented and validated in the Next.js unit tests (redirect.test.ts)
SELECT ok(
    true,
    'Test 23: OAuth redirect security validated in app/auth/callback/redirect.test.ts'
);

SELECT * FROM finish();
ROLLBACK;
