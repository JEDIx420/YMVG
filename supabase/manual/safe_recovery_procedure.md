# YMBD Safe Recovery Procedure

This is an operational recovery document for migrations 014 through 017. It is intentionally non-destructive: do not run an ad-hoc `DROP ... CASCADE`, restore anonymous base-table access, or grant broad `UPDATE` on `public.profiles`.

1. Stop the application deployment and roll the application back to the last known-compatible commit.

2. Capture the read-only output from `post_deployment_verification.sql`, the Supabase migration history, and the current policy/function definitions.

3. If the issue is application-only, leave the database package in place and restore the previous application build. This preserves the privacy boundary while the application is corrected.

4. If a database object is faulty, restore that object from the last reviewed migration definition by applying a forward corrective migration. Do not edit migration history and do not execute migration 013.

5. Re-run `preflight_security_package.sql` and `post_deployment_verification.sql`. Recovery is complete only when anonymous access to `public.businesses`, direct `profiles.app_role` updates, and legacy-role elevation remain blocked.

6. If legacy vector functions must be disabled, use `revoke_legacy_ymbd_vector_functions.sql` after inspecting exact production signatures. Do not revoke unrelated vector functions.
