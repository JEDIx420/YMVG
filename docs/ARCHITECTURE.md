# Architectural Boundaries & Tech Stack

## Core Stack
* **Frontend:** Next.js (App Router), React, Tailwind CSS.
* **Backend & Auth:** Supabase (PostgreSQL, pgvector, Google OAuth, Storage).
* **Hosting:** Netlify.

## Strict Engineering Directives
1. **AI Semantic Search (CRITICAL STRICTURE):**
   * Library: `@xenova/transformers`.
   * You are strictly forbidden from implementing generative text LLMs or chatbots.
   * Implementation: Load `Xenova/all-MiniLM-L6-v2` inside a dedicated Web Worker (`lib/workers/embedding.worker.ts`). Pass the generated 384-dimensional vector to a Supabase RPC function (`match_businesses`) to query the `pgvector` extension.
2. **SEO & Routing:**
   * `app/directory/page.tsx` MUST utilize React Server Components to fetch initial data from Supabase for web crawler indexing.
    * **Google Drive Image Pipeline:** The CSV contains Google Drive `open?id=` links. The ingestion utility MUST programmatically convert these to direct download links (`uc?export=download&id=`), fetch the buffer, and upload the image directly to the Supabase `business_media` storage bucket. Do not save Drive links to the database.

## 4. Next.js Routing Structure (Phase 8)
* **Heritage Routes (Static):** 
    * `/about/philosophy` (Charter/Values)
    * `/about/history` (1922 legacy, YMCA partnership)
* **SWIR Region Routes (Local):**
    * `/region/leadership` (Regional Director & Cabinet)
    * `/region/clubs` (Directory of local clubs)

## 5. Layout & Navigation
* **Global Layout (`app/layout.tsx`):** Requires a Mega-Menu Navbar with dropdown configurations for 'About YMI' and 'SWIR'.
* **Footer:** Requires a comprehensive Global Footer for cross-site navigation and branding.

## Authentication & Claiming
* **CRITICAL:** This platform uses closed claiming. Businesses are pre-populated via Google Sheets. Users CANNOT arbitrarily claim businesses. Instead, a Server Action automatically matches the user's Google Auth email against the `contact_email` column in the database to grant ownership.
