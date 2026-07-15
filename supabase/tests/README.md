# YMBD Database Security Hardening Tests

> Authoritative project context: [`../../docs/YMBD_SOURCE_OF_TRUTH.md`](../../docs/YMBD_SOURCE_OF_TRUTH.md). These tests are prepared database tests; repository presence is not evidence that they passed.

This directory contains database-level integration and security tests written using pgTAP.

## Prerequisites
- Docker Desktop must be installed and running.
- Supabase CLI must be installed (`npx supabase` is used here).

## Execution Instructions
Run the following commands in order in the project root directory:

```bash
# 1. Start the local Supabase environment (launches Docker containers)
npx supabase start

# 2. Reset the database to apply all migrations (001 through 023) fresh
npx supabase db reset

# 3. Run the pgTAP test suite against the local database
npx supabase test db
```

## Covered Security Assertions
The test suite in `rls_security.test.sql` asserts the following security boundaries:
1. Standard member direct modification of `app_role` is blocked.
2. Standard member direct modification of immutable profile fields (`email`, `user_id`) is blocked.
3. Standard member self-elevation to `review_admin` is blocked.
4. Standard member self-elevation to `super_admin` is blocked.
5. Only `super_admin` accounts can execute `assign_user_role` successfully.
6. Safety block prevents demoting the last remaining `super_admin`.
7. Audit records are automatically logged in `role_audit` table.
8. Business creation automatically elevates a standard member to `business_owner`.
9. Business creation does not downgrade `review_admin` or `super_admin`.
10. `review_admin` can read all business listing records.
11. `review_admin` cannot modify other owners' business listings.
12. `review_admin` cannot delete any business listing.
13. `review_admin` can moderate ad campaigns (approve/reject/pause/resume) via RPC.
14. `review_admin` cannot perform arbitrary updates to `ad_campaigns` table.
15. Anonymous visitors can select from the `public_businesses` view.
16. Anonymous visitors cannot query the `businesses` base table directly.
17. The `public_businesses` view hides private owner columns (`owner_email`, `owner_phone`, `imis_id`).
18. Full-text search RPC returns only public columns.
19. Business owners can read and edit their own business profiles.
20. Business owners cannot read other owners' private listings.
21. Anonymous direct insertions to `leads` table are blocked.
22. Authenticated direct insertions to `leads` table are blocked.
23. OAuth callback redirect sanitization checks.

The prepared `onboarding_workflow.test.sql` suite additionally covers club hierarchy mapping, public club listing, registration submission and duplicate blocking, reviewer authorization, approved-member activation, existing-profile compatibility, unapproved denial, one-time club selection, audited admin correction, and business club derivation.
