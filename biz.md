# YMI Business Directory - Architecture Audit (1-to-1)

This document provides an exhaustive, deep-dive technical audit of the current Business Architecture, mapped out specifically to identify constraints and logical paths before refactoring to a 1-to-Many "Portfolio" model.

## 1. Database Schema & Security

### The `businesses` Schema
Based on the generated types and vector setup migrations, the `businesses` table holds the following core structure:

```typescript
export interface Business {
  id: string; // UUID (Primary Key)
  owner_id: string | null; // UUID linking to auth.users
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
  embedding: number[] | null; // vector(384)
  brochure_url?: string | null;
  owner_email?: string | null;
}
```

### Constraints & Unique Keys
*   **`owner_id`**: The application layer explicitly treats this as a **1-to-1** relationship. All existing Supabase queries against `owner_id` use the `.single()` modifier. 
    > [!WARNING]
    > If a user somehow acquires two businesses in the current schema (e.g., via admin override), the `.single()` queries will crash the application by throwing a PostgREST error: *"Multiple (or no) rows returned for single row response"*. 
    > If we move to a 1-to-Many model, every single `.single()` query on `owner_id` must be refactored to `.select()` (returning an array) or constrained by a specific `business_id`.

### Row Level Security (RLS)
The table implements RLS. Based on our pre-flight login checks, fields containing PII (like `owner_email`) are restricted from anonymous queries. Unauthenticated users cannot scrape owner emails, requiring `SUPABASE_SERVICE_ROLE_KEY` bypasses for specific authentication hooks.

---

## 2. The Data Fetching Layer (Auto-Claim & Retrieval)

The core retrieval engine for the Dashboard operates out of `app/actions/getOrSyncBusiness.ts`.

### Execution Flow
The `getOrSyncBusiness` function executes a two-step retrieval and mutation pattern:

**Step 1: Primary Fetch**
It attempts to locate the business directly linked to the user's UUID.
```typescript
let { data: business } = await supabase
  .from('businesses')
  .select('*')
  .eq('owner_id', user.id)
  .single();
```

**Step 2: Auto-Claim Fallback (Orphan Binding)**
If the primary fetch fails (`!business`), the system executes a fallback query searching for a "stub" business where the `owner_email` matches the authenticated user's email, **AND** the `owner_id` is explicitly `null`.
```typescript
const { data: orphanedBusiness } = await supabase
  .from('businesses')
  .select('*')
  .eq('owner_email', user.email)
  .is('owner_id', null)
  .single();
```
If found, it instantly mutates the record, binding the `user.id` to the row via an `.update()`, and returns the newly synced business to the dashboard.

---

## 3. The Dashboard UI State

The dashboard UI (`app/dashboard/page.tsx`) currently acts entirely as a **Single-Entity State Machine**. 

### TypeScript Interface Constraints
The UI expects the `business` object returned from `getOrSyncBusiness` to be either a single `Business` object or `null`. There is absolutely no array mapping logic (`business.map(...)`) present in the dashboard. 

### The Empty State
If the user has no business (`!business`), the dashboard renders a full-page conversion UI:
```tsx
{!business ? (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
      <Briefcase className="w-12 h-12 text-slate-400" />
    </div>
    {/* ... Welcome text ... */}
    <Link href="/dashboard/onboarding">
      Create Your Business Profile
    </Link>
  </div>
) : (
  // Single Business Dashboard UI
)}
```

> [!IMPORTANT]  
> To support a Portfolio architecture, this UI must be entirely rewritten to render a **List View / Grid View** of `businesses[]`, moving the "Create Profile" button from a full-page Empty State to a persistent "+ Add New Business" action in the dashboard header.

---

## 4. The Form Mutation Layer (Onboarding/Edit)

The profile creation and modification engine resides in `app/dashboard/onboarding/OnboardingForm.tsx`.

### Identity Resolution & Execution Path
When the user submits the form, the `onSubmit` handler checks for the presence of `initialData?.id` to determine whether this is an **INSERT** or an **UPDATE**. 

*   **UPDATE Logic (Pre-existing Stubs & Edits):**
    If the form was loaded with `initialData` (e.g., an auto-claimed stub), it explicitly targets that row's UUID:
    ```typescript
    const { data: updatedBusiness, error } = await supabase
      .from('businesses')
      .update(payload)
      .eq('id', initialData.id)
      .select('id')
      .single();
    targetBusinessId = updatedBusiness.id;
    ```
*   **INSERT Logic (Net-New Creations):**
    If there is no initial data, it inserts a brand new row. Because of the current architecture, it inherently trusts that the user does not already have a business (relying on the dashboard UI to route them here only if they have an empty state).
    ```typescript
    const { data: insertedBusiness, error } = await supabase
      .from('businesses')
      .insert([payload])
      .select('id')
      .single();
    targetBusinessId = insertedBusiness.id;
    ```

### Post-Mutation Pipeline
Regardless of whether it was an Insert or Update, the code captures the `targetBusinessId`. It then immediately concatenates the brand name, category, and description to generate a new Vector Embedding via the NVIDIA NIM API, injecting that vector back into the `businesses.embedding` column to guarantee instant searchability.
