# Y's Men's International Business Directory - Hybrid Search Architecture

> **Historical document:** NVIDIA embeddings and vector/hybrid search are not active in the current directory path. Current search is PostgreSQL keyword/full-text search through `keyword_search_businesses()`. See [`docs/YMBD_SOURCE_OF_TRUTH.md`](docs/YMBD_SOURCE_OF_TRUTH.md).

This document provides a highly detailed, production-ready specification of the entire hybrid search, vector embedding, ad campaign boost calculations, and dynamic filtering pipeline implemented in the Y's Men's International Business Directory. It traces execution paths from the frontend user interface down to the low-level PostgreSQL vector algebra, reciprocal rank fusion mathematics, and automatic search fallback behaviors.

---

## 1. Hybrid Search Strategy & RRF Mathematics

To deliver a state-of-the-art search experience that handles both precise keyword overlaps and abstract conceptual alignments, the platform utilizes a **hybrid search model**. This strategy combines **Full-Text Search (FTS)** with **Dense Semantic Vector Search**, merging the resulting ranks into a single unified list using **Reciprocal Rank Fusion (RRF)**, which is then dynamically adjusted by promotional campaign boosts.

### Generation & Processing Flows

```
                        [ User Search Query ]
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
[ Full-Text Search ]                            [ AI Semantic Search ]
  - English dictionary tokenization               - NVIDIA NIM Embedding API
  - Stopwords removal & stemming                  - Model: nv-embedqa-e5-v5
  - Priority weights:                             - 1024 dense dimensions
    * Brand Name (A) = 1.0                        - Cosine Distance computation
    * Category (B)   = 0.4                          (1 - (embedding <=> query))
    * Description (C) = 0.2
         │                                                 │
         ▼                                                 ▼
[ Text rank score & ranking ]                   [ Semantic similarity & ranking ]
          │                                                 │
          └────────────────────────┬────────────────────────┘
                                   ▼
                      [ Reciprocal Rank Fusion ]
                        - k = 60 smoothing
                        - 70% Semantic Vector weight
                        - 30% Keyword Search weight
                                   │
                                   ▼
                   [ Ad Campaign Boost Integration ]
                     - Multiply score by ac.boost_multiplier
                                   │
                                   ▼
                     [ Dynamic Drop-off Filtering ]
```

1. **Full-Text Keyword Search (FTS)**:
   - Text inputs are normalized using the standard Postgres `english` search dictionary config.
   - Text elements are prioritized using `setweight` to grade match priorities:
     - **Weight A (1.0)**: `brand_name` (exact brand query matches rank highest).
     - **Weight B (0.4)**: `category` (matches against the business category).
     - **Weight C (0.2)**: `description` (matches against the detail-rich listing text body).
   - The FTS engine ranks matches based on the standard `ts_rank` algorithm.

2. **Semantic Vector Search**:
   - The user query is sent to the NVIDIA NIM embeddings service to generate a dense representation.
   - The system utilizes the **`nvidia/nv-embedqa-e5-v5`** model to generate a **`1024-dimensional`** float array.
   - In PostgreSQL, vector similarity is computed via the Cosine Distance operator (`<=>`) using the formula:
     $$\text{Semantic Similarity} = 1 - (\text{embedding} \Leftrightarrow \text{query\_embedding})$$
   - Rows are ordered by similarity score to assign a 1-based semantic search rank.

### Reciprocal Rank Fusion (RRF) Formula
To merge these two rankings cleanly without domain-specific score normalization issues, we employ the Reciprocal Rank Fusion algorithm. 
The raw score is computed as:

$$\text{Raw Score} = \left( \frac{1}{k + R_{\text{Semantic}}} \times W_{\text{Semantic}} \right) + \left( \frac{1}{k + R_{\text{FTS}}} \times W_{\text{FTS}} \right)$$

Where:
- **$k = 60$**: The rank smoothing constant.
- **$R_{\text{Semantic}}$**: The 1-indexed rank of a business in the vector similarity subset.
- **$R_{\text{FTS}}$**: The 1-indexed rank of a business in the keyword search subset.
- **$W_{\text{Semantic}} = 0.70$**: The vector semantic search weight.
- **$W_{\text{FTS}} = 0.30$**: The keyword search weight.

### Promotional Boost Integration
The database merges the RRF scores with advertising boost data. For each matching business, the database checks for an active advertising campaign in `public.ad_campaigns` of type `'search_boost'`. If found, the raw score is adjusted:

$$\text{Final Score} = \text{Raw Score} \times \text{Boost Multiplier}$$

Where `boost_multiplier` ranges from $1.1x$ up to $3.0x$ based on the tier purchased (Bronze, Silver, Gold, Platinum). Unpromoted listings default to a multiplier of $1.0$.

---

## 2. Upgraded Database Function Script

Below is the historical RPC signature defined in [`supabase/migrations/009_upgraded_hybrid_search.sql`](supabase/migrations/009_upgraded_hybrid_search.sql):

```sql
CREATE OR REPLACE FUNCTION public.hybrid_search_businesses(
  query_embedding vector(1024),
  query_text text,
  category_filter text default null,
  location_filter text default null,
  match_count int default 20
)
returns table (
  id uuid,
  owner_id uuid,
  owner_name text,
  contact_email text,
  contact_phone text,
  owner_phone text,
  brand_name text,
  category text,
  description text,
  services text[],           -- FIXED: Changed from jsonb to text[]
  special_offer text,
  address text,
  tagline text,
  website_url text,
  logo_url text,
  primary_image_url text,
  gallery_urls text[],       -- FIXED: Changed from jsonb to text[]
  sponsorship_tier double precision, -- FIXED: Changed from integer to double precision
  ym_region text,
  ym_club text,
  ym_designation text,
  embedding vector(1024),
  is_boosted boolean,
  final_score float
)
language sql stable
as $$
  with filtered_businesses as (
    select *
    from businesses
    where (category_filter is null or category_filter = 'All' or category = category_filter)
      and (location_filter is null or location_filter = 'All' or city = location_filter)
  ),
  vector_matches as (
    select id, 1 - (embedding <=> query_embedding) as vector_similarity,
           rank() over (order by embedding <=> query_embedding) as rank
    from filtered_businesses
    where embedding is not null
  ),
  text_matches as (
    select id, ts_rank(
      setweight(to_tsvector('english', coalesce(brand_name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(category, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'C'),
      websearch_to_tsquery('english', query_text)
    ) as text_score,
    rank() over (order by ts_rank(
      setweight(to_tsvector('english', coalesce(brand_name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(category, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'C'),
      websearch_to_tsquery('english', query_text)
    ) desc) as rank
    from filtered_businesses
    where query_text <> '' and websearch_to_tsquery('english', query_text) @@ (
      setweight(to_tsvector('english', coalesce(brand_name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(category, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'C')
    )
  ),
  rrf_raw as (
    select
      b.id,
      (coalesce(1.0 / (60 + v.rank), 0.0) * 0.7) + (coalesce(1.0 / (60 + t.rank), 0.0) * 0.3) as raw_score
    from filtered_businesses b
    left join vector_matches v on v.id = b.id
    left join text_matches t on t.id = b.id
    where v.id is not null or t.id is not null
  )
  select
    b.id,
    b.owner_id,
    b.owner_name,
    b.contact_email,
    b.contact_phone,
    b.owner_phone,
    b.brand_name,
    b.category,
    b.description,
    b.services,
    b.special_offer,
    b.address,
    b.tagline,
    b.website_url,
    b.logo_url,
    b.primary_image_url,
    b.gallery_urls,
    b.sponsorship_tier,
    b.ym_region,
    b.ym_club,
    b.ym_designation,
    b.embedding,
    (ac.id is not null) as is_boosted,
    (r.raw_score * coalesce(ac.boost_multiplier, 1.0))::float as final_score
  from rrf_raw r
  join businesses b on b.id = r.id
  left join public.ad_campaigns ac on ac.business_id = b.id 
    and ac.status = 'active'
    and now() between ac.start_date and ac.end_date
  order by final_score desc
  limit match_count;
$$;
```

---

## 3. Server Action Architecture & Drop-off Rules

### Next.js Server Action (`app/actions/search.ts`)
The server-side component coordinates query parsing, embedding requests, and filters out listings failing to meet the drop-off threshold.

```typescript
"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getEmbedding } from "./getEmbedding";
import { Business } from "@/types/database.types";

export type SearchResult = Business & {
  final_score: number;
  is_boosted: boolean;
};

export async function performHybridSearch(
  searchText: string, 
  category: string | null,
  location: string | null = null
): Promise<SearchResult[]> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    const trimmedQuery = searchText.trim();

    // Stage 1: Empty Query Bypass (Category/Location-only browsing)
    if (!trimmedQuery) {
      let query = supabase.from('businesses').select('*');
      
      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      if (location && location !== 'All') {
        query = query.eq('city', location);
      }
      
      const { data, error } = await query.limit(20);
      
      if (error) {
        console.error("Simple Category Search Error:", error);
        return [];
      }

      return (data as Business[]).map(b => ({
        ...b,
        final_score: 1.0,
        is_boosted: false
      }));
    }

    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await getEmbedding(trimmedQuery);
    } catch (err) {
      console.error("Error during embedding generation:", err);
    }

    const { data, error } = await supabase.rpc('hybrid_search_businesses', {
      query_embedding: queryEmbedding || null,
      query_text: trimmedQuery,
      category_filter: category === 'All' ? null : category,
      location_filter: location === 'All' ? null : location,
      match_count: 20
    });

    if (error) {
      console.error("Hybrid Search Error:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Dynamic Relational Drop-off Filter
    const topScore = data[0].final_score;
    const DROPOFF_THRESHOLD = 0.50;
    const minimumAcceptableScore = topScore * DROPOFF_THRESHOLD;
    
    const filteredResults = data.filter((business: any) => business.final_score >= minimumAcceptableScore);

    // Stage 3: Score Normalization (RRF max is 1/61, so multiply by 61 for UI %)
    return (filteredResults as SearchResult[]).map(b => ({
      ...b,
      final_score: Math.min(b.final_score * 61, 1.0)
    }));
  } catch (err) {
    console.error("performHybridSearch failed:", err);
    return [];
  }
}
```

### Dynamic Relational Drop-off Filter Mathematics
Rather than relying on static, hardcoded score cutoffs, the search pipeline scales the filter dynamically:

$$\text{Score}_{\text{Minimum}} = \text{Score}_{\text{Top}} \times 0.50$$

This relational cutoff ensures:
- If the highest-scoring business is a highly qualified match, the minimum score threshold scales up to preserve search relevance.
- If matches are low-scoring, the threshold drops to avoid displaying a blank state.

---

## 4. Zero-Hardcoding UI Dynamic Filtering

To avoid obsolete selections, options are not hardcoded. Category and Location dropdown filters are populated dynamically.

### Dynamic lookup collectors
The system queries unique values in parallel:
```typescript
export async function getUniqueCategories(): Promise<string[]>;
export async function getUniqueCities(): Promise<string[]>;
```
On mounting `components/DirectoryClient.tsx`, these fetches are triggered concurrently:
```typescript
React.useEffect(() => {
  const fetchFilters = async () => {
    const [cats, cities] = await Promise.all([
      getUniqueCategories(),
      getUniqueCities()
    ]);
    setAvailableCategories(['All', ...cats]);
    setAvailableLocations(['All', ...cities]);
  };
  fetchFilters();
}, []);
```

### Automatic Fallback Workflow
When a filtered category or location search returns `0` matches:
1. The client-side controller catches the empty result set.
2. It resets the category filter state to `'All'` and the location state to `'All'`.
3. It immediately triggers a fallback search query globally across the entire directory.
4. It displays an notification banner: *"No direct matches found in this category. Expanding search across all categories."* to keep the search user onboarding fluid.
