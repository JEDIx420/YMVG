# Architectural Boundaries & Tech Stack

> Authoritative current context: [`YMBD_SOURCE_OF_TRUTH.md`](YMBD_SOURCE_OF_TRUTH.md). This file is a focused architecture summary.

## Core Stack
* **Frontend:** Next.js (App Router), React, Tailwind CSS.
* **Backend & Auth:** Supabase (PostgreSQL, Google OAuth, magic links, approval-gated activation, Storage client APIs).
* **Hosting:** Netlify.

## Authentication & Role-Based Access Control (RBAC)
The active permission roles are:
```
member -> business_owner -> review_admin -> super_admin
```
* **Legacy Roles:** `region_admin` is treated as a legacy role and receives no elevated system privileges, route clearances, or access.
* **Role Modifications:** Direct application writes to `profiles.app_role` are strictly forbidden. All deliberate role changes must invoke the database RPC `public.assign_user_role(target_profile_id, requested_role)`, which enforces executor authority (`super_admin` only) and audit trail logging.
* **Automatic Promotion:** When a `member` registers a business listing, they are automatically elevated to `business_owner` via the database-level `public.create_my_business` transactional routine (which invokes `promote_to_business_owner()`).

## Directory Data Privacy & Isolation
* **Public Access View:** Direct SELECT access on the base `businesses` table is revoked from anonymous and public roles. All public requests read from `public.public_businesses` view defined with `security_barrier = true`, filtering out private owner profiles, emails, phones, and international `imis_id` values.
* **RLS Protection:** Authenticated owners can select/update their own businesses. Reviewers (`review_admin`) and `super_admin` have read access, but only the personal owner or `super_admin` may execute updates. Deletions are restricted exclusively to `super_admin`.
* **Lead CRM Hardening:** Direct database inserts on the `leads` table are blocked for public and authenticated clients. All submissions route through the `sendLead` Server Action, which validates, inserts with the server-only client, and dispatches through Resend. A hard-coded BCC remains verified technical debt.

## Search Pipeline
* **Keyword Search RPC:** Bypasses legacy vector embeddings and NVIDIA reranking in favor of PostgreSQL-native Full-Text Keyword Search (`public.keyword_search_businesses`). It filters by category/city and dynamically boosts active sponsored campaigns.
* **pgvector Extension:** The `vector` extension remains active for unrelated or auxiliary functions, but is fully bypassed in the core catalog search.
* **Legacy NVIDIA Code:** `app/actions/rerankBusinesses.ts` remains but has no repository caller. It is dormant, not part of active search.

## UI/UX Standards & Interactions
* **Motion Library:** `framer-motion` handles page slide entrances (`app/template.tsx`), staggered grid entries, and animated search results layout changes.
* **Hydration Fixes:** Sidebar components implement conditional client-side mounting (`mounted` state check) to eliminate hydration mismatches during server pre-rendering.
