# YMBD Source of Truth

Last repository audit: 2026-07-15. This document is authoritative for the current YMBD repository. It describes verified code and migration intent. It does not prove the state of the hosted Supabase project; production-only facts are marked unknown.

## A. Project Overview

**Y's Men's Business Directory (YMBD)** is the South West India Region (SWIR) digital directory and member platform for Y's Men International. It serves two related purposes:

- A public, searchable business directory with public listing pages and enquiry forms.
- An approval-based private platform where members maintain profiles, register businesses, receive leads, inspect analytics, request sponsorship campaigns, and perform role-specific review work.

Target users are public visitors, approved members, business owners, registration/campaign reviewers, and super administrators. The Next.js application is configured for Netlify, while PostgreSQL, Auth, and Storage are provided by Supabase. Database changes are prepared as SQL and manually executed in the Supabase SQL Editor; repository presence does not prove production application.

## B. Tech Stack

Versions are from `package.json` and the lockfile-visible install.

| Layer | Current repository version or implementation |
| --- | --- |
| Framework | Next.js `16.2.3`, App Router, React Compiler enabled |
| UI runtime | React and React DOM `19.2.4` |
| Language | TypeScript `^5`, strict mode |
| Database/Auth/Storage | Supabase PostgreSQL, Supabase Auth, Supabase Storage |
| Supabase clients | `@supabase/supabase-js ^2.103.0`, `@supabase/ssr ^0.10.2` |
| Styling | Tailwind CSS `^4` through `@tailwindcss/postcss` |
| Forms | React Hook Form `^7.72.1`, `@hookform/resolvers ^5.2.2` |
| Validation | Zod `^4.3.6` |
| Motion/icons | Framer Motion `^12.38.0`, Lucide React `^1.8.0` |
| Charts | Recharts `^3.8.1` |
| Email | Resend `^6.10.0`, React Email renderer `^2.0.6` |
| Hosting | Netlify, `npm run build`, `.next` publish directory |
| Tests | ESLint 9, TypeScript, Next build, Node redirect test, SQL pgTAP suites |

The application mixes Server Components, Client Components (`"use client"`), Server Actions (`"use server"`), route handlers, and SQL RPCs. Browser clients live in `utils/supabase/client.ts` and `lib/supabase/client.ts`; cookie-aware server clients live in `utils/supabase/server.ts`; `utils/supabase/admin.ts` creates a server-only service-role client.

## C. Repository Structure

| Path | Responsibility |
| --- | --- |
| `app/` | App Router pages, layouts, route handlers, dashboards, and Server Actions |
| `components/` | Shared navigation, directory, forms, enquiry, email, and dashboard UI |
| `lib/` | Shared validation and one browser Supabase client |
| `utils/supabase/` | Browser, cookie-aware server, admin, and authenticated-action clients |
| `types/` | Hand-maintained application database/domain types |
| `docs/` | Current architecture, deployment, domain, and data-quality documentation |
| `public/` | Logos, history media, downloads, blog JSON, and the SWIR club source PDF |
| `supabase/migrations/` | Ordered forward database migrations; never edit an applied migration |
| `supabase/manual/` | Preflight, verification, audit, recovery, and optional cleanup scripts |
| `supabase/tests/` | Prepared pgTAP security and onboarding tests |
| `supabase/audit/` | Read-only database inventory/audit queries |

## D. User and Role Model

Active roles are `member`, `business_owner`, `review_admin`, and `super_admin`. `region_admin` remains a legacy enum/type compatibility value and receives no active elevated authorization. `admin` remains in the hand-maintained TypeScript union for historical compatibility but is not an active permission role.

| Resource/action | Member | Business owner | Review admin | Super admin |
| --- | --- | --- | --- | --- |
| Own approved profile | Read/update allowed personal fields | Same | Same, plus reviewer visibility | Same, plus administrative visibility |
| Create business | Yes, after `club_id` is set | Yes, up to limit | Possible only under normal authenticated creation rules | Possible only under normal authenticated creation rules |
| Edit business | Own listing | Own listing | No edit of another owner's listing | Any listing |
| Delete business | No | No | No | Yes |
| Leads | No listing means none | Own businesses' leads | Read all | Read all |
| Analytics | Member referral experience | Own-business analytics | Global analytics | Global analytics |
| Create campaign | Only for an owned business | Yes for owned business | Only if also the owner | Only if also the owner |
| Approve/reject/pause/resume campaign | No | No | Yes through `moderate_campaign()` | Yes through `moderate_campaign()` |
| Delete campaign | No | No | No | Yes |
| Registration review/club correction | No | No | Yes | Yes |
| Role management/audit | No | No | No | Yes through `assign_user_role()` |
| Payment proof review | No | Own submission | Yes | Yes |
| User Audit page | No | No | Yes for audit/review surfaces | Yes, including role management |

Role checks are enforced both in application routes/actions and, critically, in RLS/functions. Client-side visibility is not an authorization boundary.

## E. Authentication and Onboarding

### Login methods

`app/login/page.tsx` supports Google OAuth and email magic links. Both redirect to `/auth/callback?next=/dashboard`. `getSafeRedirect()` permits only internal paths.

### Existing approved user

```text
Login -> Supabase Auth -> /auth/callback -> exchangeCodeForSession()
-> activate_approved_member() finds an approved profile -> dashboard
```

Migration `021` backfills `account_approved_at` for every profile existing when that migration runs. Activation permits an already approved profile bound to `auth.uid()`. It can also safely bind an unbound profile whose normalized email matches the verified `auth.users` email. A profile already bound to another user is denied and audited.

### New applicant

```text
/signup -> submit_registration_request() -> pending request
-> review_admin/super_admin approves -> applicant authenticates with approved email
-> activate_approved_member() -> member profile + activated request -> dashboard
```

Signup does not create `auth.users`, profiles, roles, or businesses. Approval only makes the email eligible for a standard `member` profile.

### Unapproved login

The callback signs the session out and redirects to `/access-not-approved` when `activate_approved_member()` returns false or errors. The browser receives a generic message; conflicts are retained in `onboarding_auth_audit` or server logs.

Authentication decisions use `auth.uid()` and the verified email read from `auth.users`. Browser form or query-string email values are never trusted.

### Before User Created Hook

Migration `022` prepares `public.before_user_created_approved_email(jsonb)`. It allows an email only when an approved profile or approved registration request exists. SQL does not enable the hook; the owner enables it manually in Supabase Authentication > Hooks only after the compatible frontend/callback is deployed. The callback gate remains mandatory. Migration `022` removes the unrestricted `on_auth_user_created` trigger and `handle_new_user()` function. Emergency recovery can restore an approval-aware trigger, not open signup.

## F. Registration Request Workflow

`registration_requests` contains applicant identity/profile fields, `club_id`, status, review metadata, rejection reason, and activation links. Statuses are `pending`, `approved`, `rejected`, and `activated`. A partial unique index prevents multiple active requests for one normalized email; rejected applicants can reapply.

- `submit_registration_request(...)`: public controlled `SECURITY DEFINER` RPC; validates/normalizes input, accepts only `club_id`, checks a selectable club, and returns a generic response.
- `list_registration_requests(status)`: reviewer-only listing RPC used by User Audit.
- `review_registration_request(...)`: `review_admin`/`super_admin` gate; locks pending rows, validates approve/reject, requires a rejection reason, permits corrected club selection, and records immutable audit history.
- `activate_approved_member()`: authenticated activation gate; creates or binds only a `member` profile and atomically marks the request activated.

The UI is in `app/dashboard/users/RegistrationRequestsClient.tsx` and `UserAuditTabs.tsx`. Approval never assigns `business_owner`, `review_admin`, or `super_admin`. `business_owner` promotion occurs only through successful business creation.

## G. Club Master and Hierarchy

`swir_clubs` is the canonical club master. No `swir_club_aliases` table is present. Important fields are internal UUID `id`, external `imis_club_id`, canonical/normalized name, club type/status, district, generated zone, region code, selectability, and source period.

Club iMIS ID identifies a club; profile `imis_id`/registration `member_imis_id` identifies a person. They are not interchangeable.

| District | Derived zone |
| --- | --- |
| 1-2 | 1 |
| 3-4 | 2 |
| 5-7 | 3 |
| 8-10 | 4 |

Region is always `SWIR`. The database function `swir_zone_for_district()` and generated/check constraints enforce the mapping. Users submit only `club_id`; triggers synchronize `club`, `ym_club`, `ym_district`, `ym_zone`, and `ym_region`. Duplicate names are displayed with district and club iMIS ID. Existing free-text hierarchy remains only for compatibility and is not fuzzily backfilled.

`list_selectable_swir_clubs()` is available to anonymous and authenticated callers. `set_my_initial_club(uuid)` allows a legacy user with null `club_id` to select once. `assign_profile_club(uuid, uuid)` allows an audited reviewer correction.

Migration `019` was generated from `public/SWIR CLUB STATUS 2025-26.pdf`: 169 source rows, 168 unique club iMIS IDs, with the duplicate and spelling findings in `docs/CLUB_DATA_QUALITY_REPORT.md`.

## H. Profile Model

Important columns include `id`, nullable/bindable `user_id`, immutable `email`, editable personal fields, `imis_id`, authoritative `club_id`, compatibility club/hierarchy text, `app_role`, `account_approved_at`, and `created_at`.

Protected fields include `id`, `user_id` except controlled activation binding, `email`, `created_at`, `app_role`, approval state, `club_id`, and derived club hierarchy. Authenticated users may update only `full_name`, `phone`, `imis_id`, `address`, `city`, `state`, `country`, `education`, and `job_title`. Club initialization/correction uses RPCs.

Migration `023_lock_profile_insert_privileges.sql` makes these grant boundaries explicit:

- Anonymous users cannot read or insert profiles.
- Authenticated users cannot directly insert/delete profiles or insert/update `app_role`.
- Authenticated users have `SELECT`, still constrained by RLS.
- Authenticated users receive column-level update only for ordinary personal fields.

Verify with `supabase/manual/05_verify_profile_privileges.sql` after migration `023` is applied.

## I. Business Model

`businesses` stores ownership/private data and public listing content. `owner_id`, `owner_profile_id`, `owner_email`, and `owner_phone` are private. `contact_email` and `contact_phone` are intentionally public business contact fields exposed by `public_businesses`.

`addBusiness` validates a strict payload and invokes `create_my_business()`. The function derives owner identity and club hierarchy from the authenticated approved profile, enforces a maximum of five businesses, creates an immediately visible listing, and promotes only `member` to `business_owner`. There is no business approval workflow. Existing businesses with null `club_id` retain legacy hierarchy values.

Owners and `super_admin` can edit through the current action/RLS boundary; `review_admin` cannot edit another owner's listing. Only `super_admin` can delete a business. Public visibility is immediate; campaign approval is a separate concern.

## J. Public Directory

- `/directory` server-renders up to 100 public rows for initial display and SEO.
- `/directory/[id]` fetches one public listing client-side and logs an analytics event.
- `public_businesses` is the anonymous/authenticated read surface and excludes private owner identifiers/contact details.
- Anonymous clients must not query `businesses` directly.
- `app/sitemap.ts` adds public business detail routes and revalidates hourly.
- Directory filters are keyword, category, and city. Empty filters restore the initial list; empty results show a user-facing reset state.

## K. Search

The active path is `components/DirectoryClient.tsx` -> `app/actions/search.ts` -> `keyword_search_businesses(query_text, category_filter, location_filter, match_count)`. It uses PostgreSQL keyword/full-text matching, limits results to 20, applies category/city filters, and includes active campaign boosting exposed as `is_boosted`/`search_score`. A relative score drop-off is applied in the Server Action.

NVIDIA is not active in directory search. `app/actions/rerankBusinesses.ts` still contains an unreferenced NVIDIA action and `NVIDIA_API_KEY` usage, but repository search finds no caller; treat it as dormant legacy technical debt. Historical vector/hybrid migrations and functions remain. The PostgreSQL `vector` extension supports other database capabilities; never drop it and never remove or revoke unrelated `match_properties`.

## L. Leads and Enquiries

`components/EnquiryModal.tsx` collects name, email, phone, message, business UUID, and an optional Turnstile token. `sendLead` uses strict Zod validation, a server-only admin client to resolve the business and insert `leads`, renders a React Email template, and sends through Resend. Direct anonymous/authenticated lead inserts are revoked. Owners see leads for their businesses; reviewers and super admins can read all under RLS/application routing.

The Resend message currently sends to `contact_email` or fallback `owner_email` and has a hard-coded BCC address in `app/actions/sendLead.ts`. That is verified current behavior and a privacy/configuration debt.

Turnstile is explicitly feature-flagged. With both `TURNSTILE_ENABLED` and `NEXT_PUBLIC_TURNSTILE_ENABLED` false, no widget/token is required. When enabled, the client requires `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; the server requires `TURNSTILE_SECRET_KEY`, fails closed on missing/placeholder configuration, and rejects missing/invalid tokens. `.env.example` documents the disabled configuration.

## M. Analytics

`analytics_events` stores business views/referral attribution. `logAnalyticsEvent` uses the service-role client in a Server Action for public event insertion. The global analytics and leads pages also use service-role reads after first checking the signed-in profile role. Business owners receive listing-specific analytics; `review_admin` and `super_admin` receive global views.

Charts use Recharts in `AnalyticsClient.tsx`, `OwnerAnalyticsClient.tsx`, and `AdminView.tsx`. Responsive chart parents now have explicit heights, full width, positioned containment, `min-w-0`, and positive initial dimensions to avoid Recharts' `-1` size warning. No known chart-size warning remains in the audited code, but browser smoke testing is still required.

## N. Campaigns and Sponsorship

`ad_campaigns` supports `search_boost` and `homepage_patron`. Owners submit campaigns for owned businesses in `pending` state. Homepage patron requests require a payment-proof URL; search boosts use a multiplier between the action's accepted bounds.

`moderate_campaign(uuid, text)` permits only `review_admin` and `super_admin` to approve, reject, pause, or resume. Business owners cannot pause/resume active campaigns. `super_admin` alone can delete campaigns. RLS permits owner visibility/creation, reviewer visibility, constrained updates, and super-admin deletion. Active search boosts affect keyword ranking; active homepage patrons are retrieved server-side with the service role.

The UI uploads payment proof to `payment_proofs/{profile.id}/...` and obtains a public URL. Repository SQL does not define the bucket or policy, so deployed privacy and constraints are unknown and must be audited in Supabase.

## O. Supabase Storage

Verified application bucket references:

| Bucket reference | Usage/path | Client checks | Repository policy evidence |
| --- | --- | --- | --- |
| `logos` | Business logo, `{auth.uid()}/logo_url-{timestamp}` | `image/*`, UI 5 MB maximum | Bucket creation/public flag/policies not in migrations |
| `business-images` | Primary/cover image, user-prefixed path | `image/*`, UI 5 MB maximum | Unknown from repository |
| `brochures` | Brochure, user-prefixed path | PDF or image, UI 5 MB maximum | Unknown from repository |
| `payment_proofs` | Campaign receipt, `{profile.id}/proof-{timestamp}` | File input details in promotions UI; no repository SQL limit | Unknown from repository |
| Gallery | `gallery_urls` exists, but no active gallery upload call was found | Not verified | Unknown |

The UI calls `getPublicUrl()` for all active uploads, implying it expects publicly retrievable objects. This does not prove buckets are public. Read/write ownership, MIME restrictions, file-size limits, and policies must be verified with `supabase/audit/12_storage_buckets.sql` and `13_storage_policies_grants.sql`; do not infer them from UI code.

## P. Database Security

Core controls are RLS, table/column grants, security-barrier public views, strict Server Action validation, and narrowly granted `SECURITY DEFINER` RPCs with `SET search_path = public, pg_temp`. Role changes go through audited `assign_user_role()`. Automatic owner promotion is database-controlled. Service-role usage is confined to server files and must always follow an authenticated/authorized route check where private data is read.

### Security invariants that must never be broken

1. No client mutation of `app_role`.
2. No anonymous profile access.
3. No anonymous access to the base `businesses` table.
4. No direct public insert into `registration_requests`.
5. Never trust browser-supplied owner IDs or ownership fields.
6. Never trust browser-supplied club hierarchy; derive it from `club_id`.
7. Only approved users may enter the private dashboard.
8. Only `super_admin` may manage roles.
9. `review_admin` may review but may not perform destructive business/campaign actions.
10. Secrets and service-role keys must never use `NEXT_PUBLIC_`.

## Q. Migration History

All rows below are repository migrations intended for manual SQL Editor execution. Hosted application status is **not verified from this repository**. Migrations `014`-`017` are described by operational docs as the completed Phase 1 package, but current production migration history was not queried during this audit.

| Migration | Purpose | Applied status | Notes |
| --- | --- | --- | --- |
| `014` | Add `review_admin` enum value | Production unknown | Non-transactional enum change |
| `015` | Role security/audit, role assignment, owner promotion, campaign moderation | Production unknown | Depends on `014` |
| `016` | Public directory compatibility view/search/business RPC | Production unknown | Depends on `015` |
| `017` | Final public-directory/RLS/grant cutover | Production unknown | Depends on `016` |
| `018` | SWIR club master, hierarchy, profile/business `club_id`, club RPCs | Production unknown | Depends on `014`-`017` |
| `019` | Deterministic SWIR 2025-26 club seed | Production unknown | Depends on `018` |
| `020` | Registration requests, review, audit, RPC/grants | Production unknown | Depends on `018`/`019` |
| `021` | Approved activation, approval marker, existing-user compatibility | Production unknown | Leaves legacy trigger until cutover |
| `022` | Final login cutover, Auth Hook function, club protection/business derivation | Production unknown | Must follow compatible frontend deployment |
| `023` | Lock profile insert/delete and protected-column privileges | Production unknown | Verify with manual script `05` |

Never infer production state from file presence. Use `supabase_migrations.schema_migrations` and the manual verification scripts.

## R. Manual SQL Files

| File | Class | Use |
| --- | --- | --- |
| `00_onboarding_preflight.sql` | Preflight | Checks Phase 1/schema/auth prerequisites and conflicts |
| `01_verify_club_seed.sql` | Verification | Club counts, duplicate identities, mapping, selectability |
| `02_verify_registration_workflow.sql` | Verification | Tables, RLS, RPC grants, policies, approval markers |
| `03_post_login_cutover_verification.sql` | Verification | Trigger removal, hook grants, activation/hierarchy, directory boundary |
| `04_safe_onboarding_recovery.sql` | Emergency recovery | Approval-aware trigger recovery after disabling Auth Hook; never normal verification |
| `05_verify_profile_privileges.sql` | Verification | Expected grants after migration `023` |
| `audit_recent_users.sql` | Read-only audit | Profile completeness, role, club, and owned-business review |
| `preflight_security_package.sql` | Preflight | Phase 1 package checks; excludes migration `013` |
| `post_deployment_verification.sql` | Verification | Phase 1 grants, roles, policies, search/directory boundaries |
| `revoke_legacy_ymbd_vector_functions.sql` | Optional cleanup template | Requires exact signatures; never touch `match_properties` |
| `safe_recovery_procedure.md` | Recovery guide | Non-destructive Phase 1 recovery process |

Supabase SQL Editor may display only the last result grid. Run sections separately or export each result when every check must be retained.

## S. Environment Variables

| Variable | Scope | Required | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Yes | Supabase project URL for browser/server clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Yes | Supabase anonymous key; RLS remains mandatory |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Yes for leads/analytics/patrons/admin reads | Bypasses RLS; never expose to browser |
| `RESEND_API_KEY` | Server only | Yes for lead/access email actions | Resend API authentication |
| `RESEND_FROM_EMAIL` | Server only | Optional/currently access-request only | Sender override; fallback exists |
| `TURNSTILE_ENABLED` | Server only | Required flag | Enables server verification only when exactly `true` |
| `NEXT_PUBLIC_TURNSTILE_ENABLED` | Public | Required flag | Controls widget rendering |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public | Required when enabled | Cloudflare site key |
| `TURNSTILE_SECRET_KEY` | Server only | Required when enabled | Cloudflare verification secret |
| `NEXT_PUBLIC_YSMEN_ENROLL_URL` | Public | Optional | Enrollment URL override; verified fallback exists in code |
| `NVIDIA_API_KEY` | Server only, legacy | Not required for active search | Used only by unreferenced legacy reranker |

No active site URL/auth callback environment variable was found; login builds callback URLs from `window.location.origin`, while metadata/sitemap currently contain the deployed site URL in code. `.env.local` contains secrets and must never be committed or reproduced in docs.

## T. Deployment

The configured Git remote is `https://github.com/JEDIx420/YMVG.git`, current/default working branch is `main`, and `netlify.toml` runs `npm run build` with `.next` output. Whether the GitHub repository's actual default branch differs cannot be proven locally.

Database deployment is manual. For approval onboarding use `docs/ONBOARDING_DEPLOYMENT_GUIDE.md`: preflight, migrations `018`-`021` with verification, deploy/test the compatible frontend, then migration `022`, post-cutover verification, manual Auth Hook enablement, and retesting. Migration `023` follows as a forward privilege lock and is verified with manual script `05`. Never run migration `013` as part of the Phase 1 package.

### Deployment checklist

1. Confirm a clean, reviewed commit and required environment variables in Netlify.
2. Run TypeScript, focused/full ESLint, unit tests, and `npm run build`.
3. Run the appropriate read-only preflight in Supabase SQL Editor.
4. Apply only new forward migrations in reviewed order; never edit applied SQL.
5. Run every matching verification script and retain all result sets.
6. Deploy the compatible frontend before final auth cutovers.
7. Smoke-test existing `super_admin`, `member`, and `business_owner` logins.
8. Smoke-test signup, review, approved activation, and unapproved denial.
9. Verify public directory/search/detail/enquiry behavior.
10. Enable the Before User Created Hook only after callback activation is live; disable it before emergency recovery.

## U. Design System

The visual language is Tailwind utility-driven rather than a formal component-token package.

- `app/layout.tsx` loads Geist Sans and Geist Mono variables through `next/font/google`.
- `app/globals.css` maps Tailwind font tokens to those variables, but its body rule currently sets `Arial, Helvetica, sans-serif`; Arial is therefore the effective default unless a utility overrides it.
- Public pages use white/slate surfaces, deep blue headers, red accents, gradients, and occasional Framer Motion entrances.
- Dashboard pages use a persistent responsive sidebar, white cards on slate backgrounds, compact uppercase labels, and role-specific navigation.
- Common radii are `rounded-xl`, `rounded-2xl`, and `rounded-3xl`; shadows are subtle card shadows or larger modal/auth shadows.
- Layouts use responsive grids, `max-w-*` content widths, `px-4 sm:px-6`, and mobile-first breakpoints.

| Token/use | Value | Verified usage |
| --- | --- | --- |
| Global background | `#ffffff` | `--background`, body |
| Global foreground | `#171717` | `--foreground`, body |
| Brand navy | Tailwind `blue-950` (`#172554`) | Headers, sidebar/auth panels, primary text |
| Primary blue action | `blue-600`/`blue-700` | Login and focused controls |
| Brand/action red | `red-600`/`red-700` | Apply, submit, campaign accents |
| Page surface | `slate-50` | Directory/dashboard backgrounds |
| Secondary text | `slate-500`/`slate-600` | Supporting copy |
| Borders | `slate-100`/`slate-200`/`slate-300` | Cards and controls |
| Success | `emerald-50`/`emerald-700` | Confirmation states |
| Error | `rose-50`/`rose-700` | Validation/access errors |

## V. UI Component Inventory

| Component | Purpose |
| --- | --- |
| `components/Navbar.tsx`, `Footer.tsx`, `LayoutWrapper.tsx` | Public shell/navigation |
| `components/dashboard/Sidebar.tsx` | Role-aware private navigation and view switching |
| `components/DirectoryClient.tsx` | Search/filter/result cards and empty/loading states |
| `components/forms/BusinessProfileForm.tsx` | Business create/edit form and asset uploads |
| `components/forms/PersonalProfileForm.tsx` | Personal profile editing and one-time club selection |
| `components/forms/ProfileOnboardingForm.tsx` | Legacy/member profile onboarding form |
| `components/forms/ClubCombobox.tsx` | Searchable, keyboard-accessible canonical club selector |
| `components/EnquiryModal.tsx` | Public lead form and optional Turnstile widget |
| `app/dashboard/analytics/AnalyticsClient.tsx` | Global analytics filters/charts |
| `app/dashboard/analytics/OwnerAnalyticsClient.tsx` | Owner analytics and referral leaderboard |
| `app/dashboard/components/AdminView.tsx` | Administrative dashboard summary/chart |
| `app/dashboard/users/UserAuditTabs.tsx` | User audit/registration tab shell |
| `app/dashboard/users/RegistrationRequestsClient.tsx` | Registration filters, detail modal, approval/rejection |

Loading, error, and empty states are generally implemented locally in each page/component rather than through shared global components.

## W. Important File Map

| Area | Main files |
| --- | --- |
| Auth | `app/login/page.tsx`, `app/auth/callback/route.ts`, `middleware.ts`, `utils/supabase/*` |
| Signup | `app/signup/*`, `app/actions/registrationRequests.ts`, `lib/validation/registration.ts` |
| Registration review | `app/dashboard/users/*`, migrations `020`-`021` |
| Profiles | `app/actions/profiles.ts`, `PersonalProfileForm.tsx`, migrations `015`, `021`-`023` |
| Club master | migrations `018`-`019`, `ClubCombobox.tsx`, club data report |
| Businesses | `addBusiness.ts`, `updateBusiness.ts`, `deleteBusiness.ts`, `BusinessProfileForm.tsx` |
| Directory | `app/directory/*`, `DirectoryClient.tsx`, `public_businesses` in migrations `016`-`017` |
| Search | `app/actions/search.ts`, `keyword_search_businesses()` in migration `016` |
| Leads | `EnquiryModal.tsx`, `sendLead.ts`, `LeadEmail.tsx`, migrations `010`/`017` |
| Analytics | `logAnalyticsEvent.ts`, `app/dashboard/analytics/*`, `AdminView.tsx` |
| Campaigns | `adCampaigns.ts`, dashboard campaigns/promotions, `moderate_campaign()` |
| Storage | `BusinessProfileForm.tsx`, `PromotionsClient.tsx`, storage audit scripts |
| Types | `types/database.types.ts` |
| SQL | `supabase/migrations/`, `supabase/manual/`, `supabase/audit/` |
| Tests | `supabase/tests/*`, `app/auth/callback/redirect.test.ts` |
| Deployment | `netlify.toml`, `docs/ONBOARDING_DEPLOYMENT_GUIDE.md` |

## X. Testing and Verification

| Check | Command/status |
| --- | --- |
| TypeScript | `npx tsc --noEmit`; passed in the 2026-07-15 documentation audit baseline |
| ESLint | `npm run lint` or `npx eslint <files>`; existing full-scope warnings/errors are documented technical debt, so no blanket pass is claimed |
| Production build | `npm run build`; prior attempt was inconclusive after stalling during optimized build and being stopped |
| Redirect unit test | Existing TypeScript test/helper; direct 12-case execution passed previously, while plain Node extensionless import compatibility is a known runner issue |
| pgTAP | `npx supabase start`, `npx supabase db reset`, `npx supabase test db`; prepared but not run in this work because Docker/Supabase execution was prohibited |
| Manual database verification | Run matching files in `supabase/manual/` after each migration stage |

Required smoke tests include existing-role login, approved/unapproved activation, signup/review, one-time club selection, business creation/visibility, public directory/search/detail, enquiry delivery, role boundaries, campaign moderation, and responsive chart rendering.

## Y. Known Issues and Technical Debt

### Production blockers or deployment gates

- Hosted application status for migrations `014`-`023`, Auth Hook enablement, and Storage policies is unknown until production verification is run.
- Database pgTAP suites are prepared but unexecuted in the documented workspace workflow.
- Migration `022` must not precede the compatible callback deployment; migration `023` requires privilege verification.
- Turnstile remains disabled until both valid keys and both feature flags are configured consistently.

### Non-blocking technical debt

- Some existing profiles may have null `club_id`; use one-time selection or audited correction, not fuzzy backfill.
- Legacy free-text club/hierarchy columns remain for compatibility.
- `region_admin` and historical `admin` typing remain but must never grant access.
- Dormant `rerankBusinesses.ts`, historical NVIDIA/vector functions, and legacy public text files can confuse audits.
- Optional legacy vector-function revocation requires production signature inspection; `match_properties` must remain untouched.
- Storage bucket policies/limits are not represented in migrations.
- Lead email contains a hard-coded BCC recipient.
- Effective default font differs from loaded Geist variables because the body CSS explicitly uses Arial.
- `types/database.types.ts` is hand-maintained and includes historical roles; generated schema typing is not evident.
- Full lint has pre-existing unused-variable/explicit-`any`/markup warnings; the production build result remains inconclusive.
- Recent profiles and incomplete club links require read-only/manual review via `audit_recent_users.sql`.

### Future improvements

- Add reviewed forward migrations for Storage buckets/policies and document verified limits.
- Remove dormant integrations only after production dependency audit.
- Replace hard-coded email/site configuration with server-only environment settings where appropriate.
- Establish a repeatable CI pipeline for typecheck, lint, build, unit tests, and disposable Supabase pgTAP.

## Z. Safe Change Rules for Future Agents

1. Never edit already-applied migrations; create forward-only migrations.
2. Verify hosted migration state instead of assuming repository files are applied.
3. Never trust browser-supplied role, ownership, user ID, or hierarchy fields.
4. Preserve existing users and roles during authentication changes.
5. Test compatibility before final cutovers.
6. Do not enable the Auth Hook before the frontend activation flow is deployed.
7. Never run emergency recovery as normal verification.
8. Never drop the vector extension or remove/revoke `match_properties`.
9. Never expose service-role, Resend, Turnstile secret, or other private keys through `NEXT_PUBLIC_`.
10. Keep public access on `public_businesses`; never reopen anonymous base-table access.
11. Keep `review_admin` non-destructive and role management `super_admin`-only.
12. Update this document after every architectural, security, migration, environment, or deployment change.
