# Y's Men's International Business Directory - Hybrid Search Deep Dive

This document provides a highly detailed, comprehensive review of the entire search pipeline for the Y's Men's International Business Directory. It traces the exact execution path from the frontend UI components down to the PostgreSQL vector math, ensuring 100% accuracy with the current implementation.

---

## 1. Architectural Overview

The Y's Men's International Business Directory search is built on a **Hybrid Search Strategy** that fuses traditional keyword matching (Full-Text Search) with high-density AI semantic intent matching (Vector Search). This combination guarantees that search queries retrieve businesses with exact keyword overlaps, while also picking up relevant matches with conceptually similar context (e.g., searching for "expert consulting" correctly maps to "management advisors" even if those exact words are not present in the listing's description).

### Reciprocal Rank Fusion (RRF)
To merge keyword search rankings with vector similarity rankings cleanly and eliminate mathematical score-mismatch discrepancies, the Postgres database implements **Reciprocal Rank Fusion (RRF)**. The RRF score is calculated as follows:

$$\text{RRF Score} = \left(\frac{1}{k + R_{\text{Semantic}}} \times W_{\text{Semantic}}\right) + \left(\frac{1}{k + R_{\text{FTS}}} \times W_{\text{FTS}}\right)$$

Where:
- $k$ is the smoothing constant set to **$60$** to reduce the disproportionate impact of outliers.
- $R_{\text{Semantic}}$ and $R_{\text{FTS}}$ are the 1-indexed ranks of a business in the vector similarity and full-text keyword searches, respectively.
- $W_{\text{Semantic}}$ is the semantic search weight set to **$0.70$** (representing $70\%$ weight).
- $W_{\text{FTS}}$ is the keyword search weight set to **$0.30$** (representing $30\%$ weight).

### Dynamic Relational Drop-off Filter
To prevent rendering completely irrelevant, low-scoring listings at the bottom of search results, the Next.js server tier implements a **Dynamic Relational Drop-off Filter** instead of a hardcoded threshold.
- The system reads the `final_score` of the top-ranked search result.
- A drop-off threshold coefficient of **$50\%$** ($0.50$) is applied.
- All subsequent results must score at least **$50\%$ of the top score** to remain in the dataset returned to the client:
  $$\text{Score}_{\text{Minimum}} = \text{Score}_{\text{Top}} \times 0.50$$
- This guarantees a highly contextual, dynamic filtering experience that scales naturally with the quality of matches returned.

---

## 2. Live Database Schema & Function Signatures

The directory's core data schema uses a dense `1024-dimensional` vector representation powered by the `pgvector` PostgreSQL extension.

### The `hybrid_search_businesses` RPC Function

The complete, live SQL definition for the hybrid search engine deployed in the database:

```sql
CREATE OR REPLACE FUNCTION hybrid_search_businesses(
  query_embedding vector(1024),          -- Deployed 1024-D vector type
  query_text text,                       -- Search keywords
  category_filter text default null,     -- Category dropdown pivot
  location_filter text default null,     -- City dropdown filter
  match_count int default 20             -- Search limit
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
  services jsonb,
  special_offer text,
  address text,
  tagline text,
  website_url text,
  logo_url text,
  primary_image_url text,
  gallery_urls jsonb,
  sponsorship_tier integer,
  ym_region text,
  ym_club text,
  ym_designation text,
  embedding vector(1024),
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
      and 1 - (embedding <=> query_embedding) > 0.25 -- Strict Semantic Threshold
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
  )
  select
    b.*,
    -- Reciprocal Rank Fusion (RRF) with weights (70% Vector / 30% Text)
    (coalesce(1.0 / (60 + v.rank), 0.0) * 0.7) + (coalesce(1.0 / (60 + t.rank), 0.0) * 0.3) as final_score
  from businesses b
  left join vector_matches v on v.id = b.id
  left join text_matches t on t.id = b.id
  where v.id is not null or t.id is not null
  order by final_score desc
  limit match_count;
$$;
```

### Key DB Mechanics Deployed:
1. **Weighted Full-Text Search (FTS)**: Native English tokenizers weight columns systematically using `setweight` to prioritize keyword matches:
   - **`A` Weight (Highest)**: `brand_name`
   - **`B` Weight**: `category`
   - **`C` Weight (Lowest)**: `description`
2. **Vector Cosine Similarity Operators**: Employs the Cosine Distance operator (`<=>`) to evaluate vector distance. By taking `1 - (embedding <=> query_embedding)`, the system calculates the exact Cosine Similarity.
3. **Strict Semantic Threshold constraint**: A strict semantic constraint `1 - (embedding <=> query_embedding) > 0.25` is active inside the `vector_matches` CTE, ensuring poor high-distance vector stubs are dropped instantly.

---

## 3. Server-Side Execution & Vector Mapping

The middle tier handles embedding generations using the NVIDIA NIM API securely on the server side and dispatches them to Supabase.

### Next.js Server Action (`app/actions/search.ts`)

The active server-side execution script for the hybrid query engine:

```typescript
"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getEmbedding } from "./getEmbedding";
import { Business } from "@/types/database.types";

export type SearchResult = Business & {
  final_score: number;
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

      // Map to SearchResult with 100% match score
      return (data as Business[]).map(b => ({
        ...b,
        final_score: 1.0
      }));
    }

    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await getEmbedding(trimmedQuery);
    } catch (err) {
      console.error("Error during embedding generation:", err);
    }

    if (!queryEmbedding) {
      console.warn("Semantic search unavailable, falling back to FTS");
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

### Embedding Pipeline & Payload Mapping
When vectors are requested, the text payload is sent directly to the NVIDIA NIM endpoint.
- **Active Model Deployed**: **`nvidia/nv-embedqa-e5-v5`**
- **Dimension Size**: **`1024`** float vector dimensions
- **API Endpoint**: `https://integrate.api.nvidia.com/v1/embeddings`
- **Transport Block**: The array returns as a dense float sequence `number[]` and is transported directly inside the RPC parameters payload without padding or manual truncation.

---

## 4. Frontend State & Interface Controls

The client directory UI (`components/DirectoryClient.tsx`) manages form inputs, filters, loading transitions, and category fallbacks using React hooks.

### State Tracking Setup
The client component tracks the following states for search parameters:
```tsx
const [searchQuery, setSearchQuery] = useState('');
const [selectedCategory, setSelectedCategory] = useState<string>('All');
const [selectedLocation, setSelectedLocation] = useState<string>('All');
```

### UI Filter Controls & Populating Dropdowns

1. **Category Filter Selector**:
   - **Populating**: The categories are queried **dynamically** from the database on mount to represent only categories that actually exist on currently verified businesses:
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
2. **Geographic Location Selector**:
   - **Populating**: Queried **dynamically** from the database on mount to extract the unique set of active cities where verified members operate:
     `availableLocations = ['All', ...dynamicCities]`
   - **Visual Details**: Split uniformly next to the category filter using a standard `min-w-[200px]` width, featuring a distinct location indicator (📍) inside the select container frame, styled to match the category's `rounded-2xl` borders, fonts, and active heights.

---

## 5. Technical Troubleshooting Matrix

| Issue | Root Cause | Operational Impact | Solution |
| :--- | :--- | :--- | :--- |
| **PGRST204 Dimension Mismatches** | Changing embedding model output (e.g. from 2048-D Llama to 1024-D E5) while keeping the database column size stagnant. | Search action fails completely; Supabase RPC throws structural exceptions due to dimensional array index inequality. | 1. Alter table column using SQL: `ALTER TABLE businesses ALTER COLUMN embedding TYPE vector(1024);`<br>2. Clear Next.js environment cache: `rm -rf .next` and recompile.<br>3. Reload Postgres schema cache: `NOTIFY pgrst, 'reload schema';` |
| **Supabase PostgREST Cache Delay** | PostgREST caching prevents the application client from discovering newly altered database columns immediately. | API queries fail with missing column/rpc signatures even after executing migrations successfully. | Send an explicit reload signal inside the Supabase SQL editor:<br>`NOTIFY pgrst, 'reload schema';` |
| **Description Length Variations** | Long-form descriptive content dilutes specific keyword density, while short descriptions lack enough contextual semantic tokens. | Cosine similarity score distributions shift drastically, reducing semantic scores for long listings. | Normalize embedding generation strings systematically into a structured format to balance keyword and conceptual representation. |
