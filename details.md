# Y's Men International (SWIR) - Comprehensive Technical Documentation

This document provides a highly comprehensive, production-grade technical breakdown of the Y's Men International South West India Region (SWIR) Business Directory and Regional Hub website. It details the complete architecture, tech stack, database schemas, AI-driven hybrid search pipeline, security controls, dynamic page designs, and search engine optimization (SEO) configurations.

---

## 1. High-Level Architecture & Tech Stack

The application is built on a modern, modern-aesthetic framework utilizing a split client-server model in Next.js. It achieves maximum visual impact through curated animations and micro-interactions, backed by secure, high-performance database queries and AI semantic search.

```mermaid
graph TD
    A[Frontend: Next.js Client Components] -- Server Actions --> B[Middle-Tier: Next.js Server Actions]
    B -- Embed API Call --> C[NVIDIA NIM Pipeline]
    B -- Hybrid Query / RPC --> D[Supabase PostgreSQL + pgvector]
    B -- Email Send --> E[Resend API / React Email]
    D -- File Storage --> F[Supabase Storage Buckets]
```

### Core Technologies
*   **Frontend Framework**: **Next.js 16 (App Router)** & **React 19**
    *   Leverages React Server Components (RSC) for initial page fetching to ensure instant indexing by web crawlers.
    *   Uses client-side templates and page wrappers with Framer Motion for premium route transitions.
*   **Styling & Motion**: **Tailwind CSS 4** & **Framer Motion 12**
    *   Dark slate & navy palettes accented by high-contrast crimson elements for a premium, international NGO aesthetic.
    *   Features glassmorphic effects (`backdrop-blur-md`), parallax sections, and stagger-animated grids.
*   **Database & Backend**: **Supabase (PostgreSQL 15+)**
    *   Enables **pgvector** extensions for high-dimensional semantic search vectors.
    *   Implements secure **Row-Level Security (RLS)** to protect member PII (emails, phone numbers).
    *   Leverages **Supabase Storage** for hosting brand logos, primary business banner images, and downloadable PDF brochures.
*   **AI Embedding Engine**: **NVIDIA NIM (Llama 3.2 Nemoretriever 300M Embed V1)**
    *   Generates highly dense **2048-dimensional vector embeddings** for semantic text queries.
*   **Email Pipeline**: **Resend API**
    *   Uses `@react-email/render` to build type-safe, beautifully formatted HTML transactional emails for lead enquiries and access requests.

---

## 2. Core Database Schema & Data Models

### The `businesses` Table
The primary domain model is the `businesses` table. It holds all record details, verification fields, region parameters, and vector embeddings.

| Column Name | PostgreSQL Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | Unique identifier for each business profile. |
| `owner_id` | `uuid` (FK) | Links to the `auth.users` table in the Supabase auth schema. |
| `owner_name` | `text` | The full name of the business owner. |
| `owner_email` | `text` | Private email for claiming matching (protected by RLS). |
| `contact_email` | `text` | Public contact email for business lead inquiries. |
| `contact_phone` | `text` | Public business phone. |
| `owner_phone` | `text` | Private owner contact phone. |
| `brand_name` | `text` | The official business brand/company name. |
| `category` | `text` | Business classification (e.g., Technology, Retail). |
| `description` | `text` | Detailed business description. |
| `services` | `jsonb` | A JSON array of specific services and expertise keywords. |
| `special_offer` | `text` | Member-only promotion details. |
| `address` | `text` | Physical office or storefront address. |
| `tagline` | `text` | Brief brand slogan. |
| `website_url` | `text` | External company website URL. |
| `logo_url` | `text` | Link to the logo file in the Supabase media bucket. |
| `primary_image_url` | `text` | Link to the main banner image in storage. |
| `gallery_urls` | `jsonb` | A JSON array of additional media gallery paths. |
| `sponsorship_tier`| `integer` | Controls directory page placement and layout badges. |
| `ym_region` | `text` | Y's Men SWIR Region (e.g., SWIR). |
| `ym_zone` | `text` | Regional Zone designation. |
| `ym_district` | `text` | Regional District code. |
| `ym_club` | `text` | Local Y's Men's club affiliation. |
| `ym_designation` | `text` | Official leadership role within Y's Men. |
| `imis_id` | `text` | Member's official international ID (e.g., YMI-12345). |
| `embedding` | `vector(2048)` | 2048-dimensional dense vector representing the brand text. |
| `brochure_url` | `text` | Link to the uploaded PDF brochure. |

### Row-Level Security (RLS) Rules
To protect member privacy, RLS policies are strictly enforced:
*   **Anonymous Select**: Allowed only for public columns (`brand_name`, `category`, `description`, `services`, `special_offer`, `logo_url`, `primary_image_url`, `ym_club`). Public users *cannot* access owner PII columns.
*   **Authenticated Select (Self)**: Users can query all fields (including PII) of rows matching `owner_id = auth.uid()`.
*   **Authenticated Update**: Allowed only if the user's `auth.uid()` matches the `owner_id` of the record, preventing unauthorized editing of directory listings.

---

## 3. The Hybrid Search & Semantic Vector Pipeline

The YMI Directory features a highly advanced **Hybrid Search Pipeline** that fuses keyword matches with AI semantic intent matches using **Reciprocal Rank Fusion (RRF)**. This ensures that a query like "expert consulting" matches listings mentioning "management advisors" even if the exact words differ.

```mermaid
flowchart TD
    A[User Inputs Search Query] --> B{Is Search Query Empty?}
    B -- Yes --> C[Simple Category Database Fetch]
    B -- No --> D[Generate 2048-D Embedding via NVIDIA NIM]
    D --> E[Call Supabase hybrid_search_businesses RPC]
    E --> F[Full-Text Search keyword match]
    E --> G[Cosine Distance vector similarity match]
    F & G --> H[Calculate RRF Fusion Score]
    H --> I[Apply Dynamic Relational Drop-off Filter]
    I --> J[Normalize Scores & Render Results]
```

### Step-by-Step Search Mechanics

1.  **Vector Generation (`getEmbedding.ts`)**:
    *   When a non-empty search query is submitted, a Server Action calls the NVIDIA NIM Embedding API using the `nvidia/llama-3.2-nemoretriever-300m-embed-v1` model.
    *   This API yields a highly detailed 2048-dimensional array representing the semantic core of the user's input.
2.  **Database Vector Fusion Query (`search.ts`)**:
    *   The generated embedding and the raw search text are passed to a Supabase PostgreSQL function (RPC) named `hybrid_search_businesses`.
    *   This RPC runs two separate queries:
        *   **Full-Text Search (FTS)** matching the search text against a search-optimized index (made of `brand_name`, `description`, `category`, and `services`).
        *   **Semantic Match** calculating the Cosine Similarity between the query's 2048-D embedding vector and the business record's `embedding` vector using the `<=>` pgvector operator.
3.  **Reciprocal Rank Fusion (RRF)**:
    *   The database combines the ranked results of the two searches using the RRF algorithm:
        $$\text{RRF Score} = \frac{1}{60 + R_{\text{FTS}}} + \frac{1}{60 + R_{\text{Semantic}}}$$
        *where $R$ is the rank index of the item (1-indexed) in the respective search result set.*
4.  **Dynamic Relational Drop-off Filtering**:
    *   To prevent displaying completely irrelevant results at the end of the list, a dynamic filter is applied:
        $$\text{Score Threshold} = \text{Top Result Score} \times 0.50$$
    *   Any result that scores below 50% of the best result's score is immediately culled from the array, keeping listings highly relevant.
5.  **Score Normalization**:
    *   Since RRF scores are naturally tiny fractions (with a mathematical maximum of $1/61 + 1/61 = 0.0327$), they are normalized by multiplying by 61, mapping them to a clean percentage ($0.0 \text{ to } 1.0$) for UI rendering.

---

## 4. Authentication, Closed-Claiming, & VIP Onboarding Flow

To keep the ecosystem exclusive and verified, the directory relies on a **Closed-Claiming** system. Members are pre-populated via verified administration lists, and new profiles must go through a secure verification workflow.

### The Auto-Claim Engine (`getOrSyncBusiness.ts`)
When a member logs in using Google OAuth, the system automatically checks if they are a pre-registered Y's Men business owner:
1.  It queries the `businesses` table for any row containing an `owner_email` that matches the logged-in user's Google Email **and** where `owner_id` is currently `null` (unclaimed stub).
2.  If it finds a match, it updates the record by setting the `owner_id` to the user's unique auth UUID. 
3.  This securely binds the business profile to that user without requiring manual admin verification.

### The VIP Verification Workflow
If a member's Google email does not match a pre-registered stub, they must undergo the VIP onboarding flow:
1.  **IMIS ID Entry**: The user inputs their official **YMI IMIS ID** (e.g., `YMI-98765`) and their registered contact email.
2.  **Security Cookie Lock**: The system sets an encrypted, short-lived cookie (`imis_id`) that expires in 15 minutes.
3.  **Cross-Database Match**: A server action validates that a business profile exists in the database where `contact_email = user.email` and `imis_id = input_imis_id`.
4.  **Ownership Binding**: Upon verification, the `owner_id` is bound to the logged-in user, granting them full dashboard access.

---

## 5. Detailed Route Directory

### Public Routes

*   **Homepage (`/`)**:
    *   *Features*: Rich hero animation, parallax scroll banner containing the official Y's Men motto, staggered stats grid showcasing international presence (80+ nations, 100+ years), and legacy navigation.
    *   *Boundaries*: Fully static for instant initial rendering.
*   **History Page (`/about/history`)**:
    *   *Features*: A detailed vertical chronological timeline tracing the Y's Men legacy from Toledo, Ohio in 1922, through the Ceylon/India Area expansion, to the centennial jubilee and modern digital leap.
    *   *Motion*: Timelines slide in and fade sequentially based on scroll view triggers.
*   **Philosophy Page (`/about/philosophy`)**:
    *   *Features*: Premium multi-panel cards presenting the core pillars: **Duty**, **Service**, **Fellowship**, and **International Peace**. Hovering over cards triggers seamless color-inverting transitions.
*   **Marketplace Directory (`/directory`)**:
    *   *Features*: Serves as the central hub of search. Initially loaded on the server (RSC) to serve the first 100 businesses instantly to search engine crawlers. Dynamically hands control to the client-side `DirectoryClient` for instant category switching and hybrid search triggers.
    *   *Automatic Fallback*: If a search in a specific category yields 0 results, the client automatically widens the search to 'All' categories and notifies the user via an active alert.
*   **Spotlight Detail Page (`/directory/[id]`)**:
    *   *Features*: A premium business profile featuring interactive slide-out enquiry forms, custom gallery layouts, promotional vouchers ("Member Offers"), and a sticky contact sidebar displaying their local Y's Men club and district status.
*   **Regional Leadership Directory (`/region/leadership`)**:
    *   *Features*: Grid layout displaying cabinet roles, district leaders, and the Regional Director's profile. Includes click-to-copy handlers for phone numbers and emails.
*   **Regional Calendar (`/region/calendar`)**:
    *   *Features*: Houses the schedule of Regional and Area programs. Includes instantaneous local filtering by event titles, districts, and months with alternate grid/timeline layout options.

### Private & Administrative Routes

*   **Dashboard (`/dashboard`)**:
    *   *Features*: A secure interface displaying the logged-in user's active business profile. Showcases verification status, profile completeness stats, and quick actions to edit profiles.
*   **Onboarding Form (`/dashboard/onboarding`)**:
    *   *Features*: A clean, interactive form built with React Hook Form and validated with Zod schemas. Handles:
        *   Multi-field details (brand description, tagline, services array).
        *   Direct files upload (logo, banner, brochure) to Supabase Storage.
        *   **Automatic Embedding Regeneration**: Saving the form compiles the new brand profile text and requests a new 2048-D embedding from the NVIDIA NIM API to ensure search indexes are instantly updated.

---

## 6. SEO, Sitemap, & Google Search Console Architecture

The site implements high-level search engine optimizations to ensure search snippets look premium and index quickly on Google.

### Sitemap & Crawler Configuration (`app/sitemap.ts`)
We utilize Next.js's dynamic sitemap builder which outputs a standard XML sitemap at `/sitemap.xml`.
*   **Static Pages**: Pre-loaded in the sitemap with optimal search priorities ($1.0$ for Home, $0.9$ for Directory, $0.8$ for sub-pages).
*   **Dynamic Profiles Indexing**: The sitemap imports `@supabase/supabase-js` to run an anonymous server-side database query, fetching the IDs of all active businesses. It maps them into live URLs (e.g. `/directory/UUID`) alongside their database `updated_at` timestamps.
*   **Static/Dynamic Hybrid Build**: By querying Supabase anonymously without cookie context, the sitemap compiles perfectly as a pre-rendered static route with a 1-hour cache revalidation, completely eliminating dynamic server headers warnings.

### Indexing Guidelines (`app/robots.ts`)
The `robots.ts` file ensures indexers only crawl useful pages and ignore private admin paths:
```typescript
{
  rules: {
    userAgent: "*",
    allow: "/",
    disallow: [
      "/dashboard",
      "/dashboard/",
      "/auth",
      "/auth/",
      "/unauthorized",
      "/login",
      "/actions",
      "/actions/",
    ],
  },
  sitemap: "https://ysmenswir-v.com/sitemap.xml",
}
```

### Favicon & Search Logo Branding
*   **Favicon Standards**: We replaced the Next.js default Vercel favicon with a custom-padded, perfectly square brand logo ($144\text{px} \times 144\text{px}$) saved as `public/favicon.png` and `public/favicon.ico`. This meets Google's strict square, multiple-of-48px favicon rules.
*   **JSON-LD Structured Data**:
    *   **`WebSite` Schema**: Injected into the root layout's HTML head to explicitly notify search engines of the primary site name ("Ys Mens International South West India Region") along with an array of alternate name spellings.
    *   **`Organization` Schema**: Maps the official website URL directly to the brand's logo image to display knowledge panels on search result sidebars.

---

## 7. Folder & Directory Structure Map

```text
├── app/
│   ├── about/
│   │   ├── history/page.tsx       # Chronicles the 1922 legacy
│   │   └── philosophy/page.tsx    # Details the 4 core pillars
│   ├── actions/                   # Next.js Server Actions
│   │   ├── getEmbedding.ts        # NVIDIA NIM 2048-D Vector API
│   │   ├── getOrSyncBusiness.ts   # Auto-claims orphaned stubs
│   │   └── search.ts              # RRF Hybrid Search execution
│   ├── auth/
│   │   └── callback/route.ts      # OAuth code/session exchange
│   ├── dashboard/
│   │   ├── onboarding/            # Profile creation & edit forms
│   │   ├── layout.tsx             # Validates active admin session
│   │   └── page.tsx               # Main business admin dashboard
│   ├── directory/
│   │   ├── [id]/page.tsx          # Business spotlight detail page
│   │   └── page.tsx               # Marketplace listing (Server Component)
│   ├── region/
│   │   ├── calendar/page.tsx      # SWIR schedules & timelines
│   │   └── leadership/page.tsx    # Regional leadership cabinet
│   ├── globals.css                # Base Tailwind styling configurations
│   ├── layout.tsx                 # Root layout (Mega-Menu, JSON-LD head scripts)
│   ├── robots.ts                  # Search crawler directives
│   ├── sitemap.ts                 # Dynamic XML sitemap generator
│   └── template.tsx               # Sliding page transition wrapper
├── components/
│   ├── DirectoryClient.tsx        # Interactive search list layout
│   ├── Navbar.tsx                 # Sticky Mega-Menu navigation header
│   └── Footer.tsx                 # Brand footer with quick navigation links
├── docs/                          # Architecture blueprints & roadmap docs
├── public/                        # Core assets (Favicons, logos)
├── types/                         # TypeScript model definitions
└── utils/
    └── supabase/
        ├── client.ts              # Supabase Client SDK instance
        └── server.ts              # Supabase Server SDK (Cookie-bound)
```
