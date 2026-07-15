# YMBD Approval-Based Onboarding Deployment Guide

> Authoritative project context: [`YMBD_SOURCE_OF_TRUTH.md`](YMBD_SOURCE_OF_TRUTH.md). This file remains the focused operational sequence for approval onboarding.

This rollout is staged so every existing `public.profiles` row remains approved and migration 022 is delayed until the updated callback is deployed and verified. The coding agent prepares files only. The project owner performs every hosted Supabase, deployment, and Dashboard action.

## Stage 1 - Project Owner Runs in Supabase SQL Editor

1. **PROJECT OWNER RUNS IN SUPABASE** - Run `supabase/manual/00_onboarding_preflight.sql`. Stop if required Phase 1 objects or schema columns are missing, normalized profile-email conflicts are returned, the super-admin count is unexpected, or onboarding migration versions are already recorded.
2. **PROJECT OWNER RUNS IN SUPABASE** - Run `supabase/migrations/018_club_master.sql`.
3. **PROJECT OWNER RUNS IN SUPABASE** - Run `supabase/migrations/019_seed_swir_clubs_2025_26.sql`.
4. **PROJECT OWNER RUNS IN SUPABASE** - Run `supabase/manual/01_verify_club_seed.sql`. Confirm 168 unique clubs, only `SWIR` region rows, no zone mismatches, no duplicate iMIS IDs, and the expected two `Hamilton` records.
5. **PROJECT OWNER RUNS IN SUPABASE** - Run `supabase/migrations/020_registration_requests.sql`.
6. **PROJECT OWNER RUNS IN SUPABASE** - Run `supabase/migrations/021_approved_member_activation.sql`.
7. **PROJECT OWNER RUNS IN SUPABASE** - Run `supabase/manual/02_verify_registration_workflow.sql`. Confirm anonymous direct table access is false, anonymous submission RPC access is true, reviewer and activation gates exist, and existing profiles have approval markers.

**PROJECT OWNER RUNS IN SUPABASE** - Do not run `022_login_final_cutover.sql` during Stage 1.

## Stage 2 - Project Owner Deploys Updated Frontend

1. **CODING AGENT PREPARES** - The updated frontend, callback, signup flow, club selector, review UI, migration package, tests, and recovery material.
2. **PROJECT OWNER DEPLOYS** - Deploy the updated application while migrations 018 through 021 are present and migration 022 is not yet run.
3. **PROJECT OWNER DEPLOYS** - Test an existing `super_admin` login.
4. **PROJECT OWNER DEPLOYS** - Test an existing `member` login.
5. **PROJECT OWNER DEPLOYS** - Test an existing `business_owner` login.
6. **PROJECT OWNER DEPLOYS** - Test `/signup`, including the searchable club dropdown and the two `Hamilton` options.
7. **PROJECT OWNER DEPLOYS** - Confirm district, zone, and `SWIR` region are displayed from the selected club and are not browser-editable.
8. **PROJECT OWNER DEPLOYS** - Submit a registration request and confirm the generic success response.
9. **PROJECT OWNER DEPLOYS** - Open User Audit > Registration Requests as both `review_admin` and `super_admin`.
10. **PROJECT OWNER DEPLOYS** - Test approval, rejection with a required reason, and club correction before approval.
11. **PROJECT OWNER DEPLOYS** - Test an approved applicant login and confirm activation creates a `member` profile.
12. **PROJECT OWNER DEPLOYS** - Test an unapproved login and confirm redirect to `/access-not-approved` with no dashboard access.
13. **PROJECT OWNER DEPLOYS** - Test one-time club selection for an existing profile with null `club_id`.
14. **PROJECT OWNER DEPLOYS** - Test business creation after club selection. Confirm immediate public visibility, inherited club hierarchy, five-business limit, and `member` to `business_owner` promotion.

## Stage 3 - Final Login Cutover

1. **PROJECT OWNER RUNS IN SUPABASE** - Only after all Stage 2 tests pass, run `supabase/migrations/022_login_final_cutover.sql`.
2. **PROJECT OWNER RUNS IN SUPABASE** - Run `supabase/manual/03_post_login_cutover_verification.sql`.
3. **PROJECT OWNER CONFIGURES IN SUPABASE DASHBOARD** - Open Supabase Dashboard > Authentication > Hooks.
4. **PROJECT OWNER CONFIGURES IN SUPABASE DASHBOARD** - Choose the **Before User Created** hook type and the **Postgres Function** implementation.
5. **PROJECT OWNER CONFIGURES IN SUPABASE DASHBOARD** - Select schema `public`, function `before_user_created_approved_email`, enable the hook, and save.
6. **PROJECT OWNER CONFIGURES IN SUPABASE DASHBOARD** - Migration 022 already grants schema usage, table reads under RLS, and function execution to `supabase_auth_admin`; it revokes hook execution from `anon`, `authenticated`, and `PUBLIC`.
7. **PROJECT OWNER DEPLOYS** - Retest an existing approved login, an approved first login, and an unapproved login. The callback gate remains mandatory even when the hook is enabled.

## Stage 4 - Profile Privilege Lock

1. **PROJECT OWNER RUNS IN SUPABASE** - After Stage 3 succeeds, run `supabase/migrations/023_lock_profile_insert_privileges.sql`.
2. **PROJECT OWNER RUNS IN SUPABASE** - Run `supabase/manual/05_verify_profile_privileges.sql` and confirm anonymous profile access and authenticated profile insertion/role mutation are false while authenticated `SELECT` is true.

Supabase's current Auth Hook contract is documented at [Before User Created Hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook).

## Disable the Hook Safely

1. **PROJECT OWNER CONFIGURES IN SUPABASE DASHBOARD** - Open Authentication > Hooks > Before User Created.
2. **PROJECT OWNER CONFIGURES IN SUPABASE DASHBOARD** - Disable the hook or remove the selected function and save.
3. **PROJECT OWNER DEPLOYS** - Leave the updated callback deployed. `activate_approved_member()` continues to deny unapproved dashboard access.

Disabling the Dashboard hook does not require broadening table grants or removing the callback check.

## Safe Recovery

1. **PROJECT OWNER CONFIGURES IN SUPABASE DASHBOARD** - Disable the Before User Created Hook first.
2. **PROJECT OWNER RUNS IN SUPABASE** - Run `supabase/manual/04_safe_onboarding_recovery.sql` only if recovery from migration 022 is required. It restores an approval-aware trigger and never restores unrestricted profile creation.
3. **PROJECT OWNER RUNS IN SUPABASE** - Re-run `supabase/manual/02_verify_registration_workflow.sql` and inspect the recovery query output.

The recovery SQL does not delete or demote profiles, delete registration requests, change clubs or roles, expose private tables, or undo migrations 014 through 017.

Frontend rollback is separate from database recovery. If the previous frontend must be redeployed, first disable the Auth Hook and run the safe recovery SQL so approved new auth users can still receive member profiles. Existing bound profiles continue to work. An unbound same-email profile is deliberately not auto-bound by recovery and requires manual conflict review; this avoids taking ownership from another auth identity.
