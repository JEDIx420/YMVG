# Technical Debt Audit Report

This document outlines the technical debt identified across the `components/` and `app/actions/` directories.

## 1. Duplicate Components

**`components/dashboard/EditBusinessForm.tsx`** vs **`app/dashboard/onboarding/OnboardingForm.tsx`**
- **Issue**: These two components are nearly identical, sharing the exact same UI layout, form schema (`zod`), state management, and file upload handlers for business profile data.
- **Recommendation**: Merge into a single reusable `<BusinessProfileForm mode="create" | "edit" initialData={data} />` component. This will ensure UI consistency and centralize bug fixes.

## 2. Repetitive Server Logic

**Fragmented Vector Embeddings Logic**
- **Issue**: The text synthesis string used to generate embeddings (`${brand_name} in ${category}. ${description}. Services: ${services.join(', ')}`) is duplicated verbatim across `app/actions/addBusiness.ts` and `app/actions/sync.ts`.
- **Issue**: Vector generation is triggered haphazardly. `OnboardingForm.tsx` triggers it client-side, `addBusiness.ts` triggers it server-side, and `updateBusiness.ts` entirely neglects to update the vector embedding upon mutation.
- **Recommendation**: Create a centralized `generateBusinessVector(businessData)` utility function that synthesizes the text and calls the NIM embedding endpoint. This should be hooked into a unified `upsertBusiness` server action.

## 3. Dead Code

The following Server Actions are exported but are never imported or utilized anywhere in the codebase. They appear to be remnants of earlier prototypes:
- **`app/actions/addBusiness.ts`**: The application currently uses a direct client-side Supabase `insert` inside `OnboardingForm.tsx`.
- **`app/actions/parseSearchIntent.ts`**: Not imported anywhere.
- **`app/actions/rerankBusinesses.ts`**: Not imported anywhere.

## 4. Import Bloat

**`components/DirectoryClient.tsx`**
- Imports `XCircle` from `lucide-react` but never renders it.
- Imports `getEmbedding` from `@/app/actions/getEmbedding` but never invokes it.
- Imports `supabase` from `@/lib/supabase/client` but never utilizes it (the component relies entirely on server actions for data fetching).
