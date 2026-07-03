# Technical Debt Audit Report - Status & Progress

This document tracks identified technical debt across the `components/` and `app/actions/` directories, marking status and recommendations.

---

## 1. Duplicate Components (RESOLVED)

*   **Identified Debt**: `components/dashboard/EditBusinessForm.tsx` and `app/dashboard/onboarding/OnboardingForm.tsx` were nearly identical, sharing the exact same UI layout, form validation, and file uploads.
*   **Resolution**: Consolidated both components into a single reusable form: `components/forms/BusinessProfileForm.tsx`. This component accepts `mode="create" | "edit"` and hydrates initial database values automatically.

---

## 2. Repetitive Server Logic (RESOLVED)

*   **Identified Debt**: Duplicated text synthesis strings used to generate vector embeddings (`${brand_name} in ${category}. ${description}. Services: ${services.join(', ')}`) across actions, and inconsistent updates upon profile modification.
*   **Resolution**: Centralized embedding updates in Server Actions. Any modifications to a listing (via `updateBusiness.ts` or `addBusiness.ts`) trigger NVIDIA NIM embeddings updates synchronously, ensuring the vector space remains up to date.

---

## 3. Dead Code (PENDING REVIEW)

*   **Identified Debt**: Server Actions that are exported but not imported or utilized in the current user flows:
    -   `app/actions/addBusiness.ts`: The onboarding flow uses form schemas and custom helper queries, but this action remains.
    -   `app/actions/parseSearchIntent.ts`: Inactive.
    -   `app/actions/rerankBusinesses.ts`: Inactive (replaced by pgvector-based Cosine Similarity and RRF scoring inside PostgreSQL functions).
*   **Recommendation**: Keep these files until staging updates are completely signed off, then safely delete them from the repository.

---

## 4. Import Bloat (RESOLVED)

*   **Identified Debt**: `components/DirectoryClient.tsx` imported unused symbols like `XCircle`, `getEmbedding`, and client-side `supabase`.
*   **Resolution**: Cleaned up the imports in `components/DirectoryClient.tsx`. Unused icons and redundant SDK instances have been removed to reduce bundle overhead.
