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
    * `/region/calendar` (Regional Calendar)

## 5. Layout & Navigation
* **Global Layout (`app/layout.tsx`):** Requires a Mega-Menu Navbar with dropdown configurations for 'About YMI' and 'SWIR'.
* **Footer:** Requires a comprehensive Global Footer for cross-site navigation and branding.

## Authentication & Claiming
* **CRITICAL:** This platform uses closed claiming. Businesses are pre-populated via Google Sheets. Users CANNOT arbitrarily claim businesses. Instead, a Server Action automatically matches the user's Google Auth email against the `contact_email` column in the database to grant ownership.

## 6. UI/UX Standards & Interactions
To maintain a premium, international NGO aesthetic, the following motion standards are enforced:

### Framework & Timings
* **Library:** `framer-motion` for all complex animations and layout transitions.
* **Base Transition:** `duration: 0.4, ease: "easeOut"` for page entrances.
* **Emphasis Transition:** `duration: 0.8, ease: "circOut"` for major hero reveals.

### Global Interactions
* **Route Transitions:** Every page MUST utilize `app/template.tsx` for a consistent slide-up entrance.
* **Sticky Navbar:** Implement `backdrop-blur-md` and background opacity shifts triggered by a `scrollY > 50` threshold.

### Sectional Effects
* **Staggered Reveals:** Use `staggerChildren: 0.1` for grid items (stats, club lists, business cards) to create a cascading entrance.
* **Viewport Triggering:** All entrance animations MUST use `whileInView` with `viewport: { once: true }` to avoid repetitive movement.
* **Layout Transitions:** Business Directory results MUST use the `layout` prop on `motion.div` to ensure cards slide to new positions during search/filtering.

