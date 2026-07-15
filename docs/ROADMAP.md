# Project Execution Roadmap

> Current architecture and verified implementation: [`YMBD_SOURCE_OF_TRUTH.md`](YMBD_SOURCE_OF_TRUTH.md). This roadmap records direction, not hosted deployment status.

## Implemented in Repository

- [x] Next.js App Router public site, directory, dashboard, and Netlify configuration.
- [x] Supabase Auth clients, Google OAuth, magic links, and callback redirect protection.
- [x] Public-directory isolation through `public_businesses` and PostgreSQL keyword search.
- [x] Active roles: `member`, `business_owner`, `review_admin`, and `super_admin`.
- [x] Approval-request signup, reviewer workflow, approved-member activation, and access-denied page.
- [x] SWIR 2025-26 club master/seed, derived hierarchy, and one-time legacy affiliation.
- [x] Business creation with database-derived ownership/club data and automatic owner promotion.
- [x] Lead, analytics, campaign moderation, audit, manual verification, and pgTAP code paths.
- [x] Forward migrations `014`-`023` prepared in the repository.

## Deployment-Gated Work

- [ ] Verify the hosted migration history and apply only missing reviewed forward migrations.
- [ ] Verify migration `023` with `supabase/manual/05_verify_profile_privileges.sql`.
- [ ] Confirm the Before User Created Hook is enabled only after compatible frontend deployment.
- [ ] Run onboarding and RLS pgTAP suites in a disposable local Supabase environment.
- [ ] Audit production Storage buckets, policies, MIME types, and file-size limits.
- [ ] Configure and test Turnstile before changing both feature flags to enabled.

## Technical Debt

- [ ] Review the hard-coded lead BCC and move approved behavior to server-only configuration.
- [ ] Audit and optionally revoke legacy YMBD vector functions without touching `match_properties`.
- [ ] Remove dormant NVIDIA reranking code only after confirming no external consumer.
- [ ] Resolve effective Arial-versus-loaded-Geist typography intentionally.
- [ ] Establish CI for typecheck, lint, build, unit tests, and pgTAP.
