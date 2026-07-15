# YMI Business Directory - Portfolio Architecture (1-to-Many)

> **Historical feature document:** Ownership, club derivation, privacy, and role rules have changed since this was written. Use [`docs/YMBD_SOURCE_OF_TRUTH.md`](docs/YMBD_SOURCE_OF_TRUTH.md) and current migrations for implementation decisions.

This document provides a technical specification of the Business Portfolio Architecture, mapping out how the platform supports multiple business listings per user profile.

---

## 1. Database Schema & Security

### The `businesses` Schema
The `businesses` table holds the core business profiles. Multiple businesses can be linked to a single owner's profile.

```typescript
export interface Business {
  id: string; // UUID (Primary Key)
  owner_id: string | null; // UUID linking to auth.users
  owner_profile_id: string | null; // UUID linking to public.profiles
  owner_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  owner_phone: string | null;
  brand_name: string | null;
  category: string | null;
  description: string | null;
  services: string[] | null; // JSONB
  special_offer: string | null;
  address: string | null;
  tagline: string | null;
  website_url: string | null;
  logo_url: string | null;
  primary_image_url: string | null;
  gallery_urls: string[] | null; // JSONB
  sponsorship_tier: number | null;
  ym_region: string | null;
  ym_zone?: string | null;
  ym_district?: string | null;
  ym_club: string | null;
  ym_designation: string | null;
  imis_id: string | null;
  embedding: number[] | null; // vector(1024)
  brochure_url?: string | null;
  owner_email?: string | null;
}
```

### 1-to-Many Relational Structure
*   **Multiple Profiles**: A user account (linked via `owner_id` or `owner_profile_id`) is allowed to own and manage multiple businesses.
*   **No Single Constraints**: Queries matching user IDs do not use `.single()`. Instead, they query lists (`.select("*")`) to prevent PostgREST errors.

### Row Level Security (RLS)
The table implements RLS. PII columns (like `owner_email` and `owner_phone`) are restricted from anonymous queries, requiring authentication or service-role level queries when administrative synchronization is executed.

---

## 2. The Data Fetching Layer (Retrieval & Claims)

The retrieval engine for the Dashboard operates out of `app/actions/getOrSyncBusiness.ts`.

### Execution Flow
The `getOrSyncBusiness` function fetches all directory listings associated with the authenticated user:

```typescript
const { data: businesses, error: fetchError } = await supabase
  .from('businesses')
  .select('*')
  .eq('owner_id', user.id);
```

- If businesses exist, it returns the array of listings.
- If no listings are owned yet, it returns `null`, prompting the user to onboard their first listing or claim a stub.

---

## 3. The Dashboard UI State

The dashboard UI (`app/dashboard/page.tsx`) renders a **Business Portfolio View** for users with the `business_owner` role.

### The List / Grid View
Instead of rendering a single form directly, the dashboard lists all businesses owned by the user. 
*   **Active Campaigns**: Showcases status badges for active marketing promotions on each listing.
*   **Analytics Overview**: Combines and displays traffic statistics (Views and Referrals) aggregated across all listings in the portfolio.
*   **Action Paths**: Links to specific edit pages (`/dashboard/business/[id]`) and allows the creation of additional listings via a persistent "+ Add New Business" action.

---

## 4. Form Mutation Layer (Onboarding/Edit)

Forms are consolidated under a unified component: `components/forms/BusinessProfileForm.tsx`.

### Insertion & Modification Actions
- **Onboarding / Creation**: Creates a new business listing, setting both the `owner_id` (auth.users UUID) and `owner_profile_id` (profiles UUID) fields automatically.
- **Editing**: Updates only the specific business listing matched by its unique listing UUID (`id`), ensuring edits to one listing do not affect other listings in the user's portfolio.
- **Vector Regeneration**: Whenever a business profile is added or modified, a Server Action regenerates the AI search vector embedding from the brand details and updates the database, keeping it search-ready instantly.
