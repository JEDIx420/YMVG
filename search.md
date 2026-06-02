# Y's Men's International Business Directory - Hybrid Search Architecture

This document provides a highly detailed, production-ready specification of the entire hybrid search, vector embedding, and dynamic filtering pipeline implemented in the Y's Men's International Business Directory. It traces execution paths from the frontend user interface down to the low-level PostgreSQL vector algebra and the reciprocal rank fusion mathematics.

---

## 1. Hybrid Search Strategy & RRF Mathematics

To deliver a state-of-the-art search experience that handles both precise keyword overlaps and abstract conceptual alignments, the platform utilizes a **hybrid search model**. This strategy combines **Full-Text Search (FTS)** with **Dense Semantic Vector Search**, merging the resulting ranks into a single unified list using **Reciprocal Rank Fusion (RRF)**.

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

To merge these two disparate ranking spaces cleanly without domain-specific score normalization issues, we employ the standard Reciprocal Rank Fusion algorithm. 

The unified score is computed as:

$$\text{RRF Score} = \left( \frac{1}{k + R_{\text{Semantic}}} \times W_{\text{Semantic}} \right) + \left( \frac{1}{k + R_{\text{FTS}}} \times W_{\text{FTS}} \right)$$

Where:
- **$k = 60$**: The rank smoothing constant. It prevents high ranks (e.g., Rank 1 vs Rank 2) from overwhelming lower-ranked results.
- **$R_{\text{Semantic}}$**: The 1-indexed rank of a business in the vector similarity subset. If a business is not matched via semantic search, this rank component defaults to a reciprocal value of $0.0$.
- **$R_{\text{FTS}}$**: The 1-indexed rank of a business in the full-text keyword search subset. If a business is not matched via keyword search, this rank component defaults to a reciprocal value of $0.0$.
- **$W_{\text{Semantic}} = 0.70$**: The vector semantic search weight, representing a **$70\%$** overall priority on user intent.
- **$W_{\text{FTS}} = 0.30$**: The keyword search weight, representing a **$30\%$** overall priority on exact token overlaps.

---

## 2. Live Database Function Script

The hybrid search database tier utilizes the `pgvector` extension configured with the optimized `1024-dimensional` vector data model. All hardcoded similarity threshold gates (such as `> 0.25`) have been **completely removed** from the SQL queries to avoid dropping highly relevant listings on short, non-conversational keyword queries.

### SQL Database Schema definition for `hybrid_search_businesses` RPC:

To perform reciprocal rank fusion hybrid searches, we define the following secure RPC signature in the PostgreSQL database (updated to **1024-dimensional** pgvector via migration `007_resize_vector_dimensions.sql`).

> [!WARNING]
> **Schema Mismatch Alert**: In the current database migrations (specifically `007_resize_vector_dimensions.sql`), the `hybrid_search_businesses` function **does not** accept a `location_filter` parameter and only filters by `category_filter`. However, the middle-tier server action in `app/actions/search.ts` invokes the RPC passing `location_filter` to the query. To ensure absolute operational safety, either the database function should be updated to accept `location_filter` or the application code should be aligned with the database signature.

Below is the **actual** RPC signature defined in `007_resize_vector_dimensions.sql`:

```sql
CREATE OR REPLACE FUNCTION hybrid_search_businesses(
  query_embedding vector(1024),          -- Deployed 1024-D vector type
  query_text text,                       -- Search keywords
  category_filter text default null,     -- Category dropdown pivot
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

---

## 3. Server Action Architecture & Drop-off Rules

The server-side component functions as the primary bridge between the user client, the NVIDIA embedding generator service, and the Supabase PostgreSQL database client.

### Next.js Server Action (`app/actions/search.ts`)

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

### Dynamic Relational Drop-off Filter Mathematics

Rather than relying on static, hardcoded score cutoffs which fail as database listings grow, the search pipeline employs a dynamic threshold based on the top-ranking result:

$$\text{Score}_{\text{Minimum}} = \text{Score}_{\text{Top}} \times 0.50$$

This relational cutoff ensures:
- If the highest-scoring business is a highly qualified match, the minimum score threshold scales up to preserve search relevance.
- If match scores are generally low due to query obscurity, the threshold drops dynamically to present the user with the next best recommendations rather than a blank state.

### Dense Embedding Payload Model Mappings

When the server action invokes the vector generator, the query text is transmitted securely inside a standard JSON payload format to the NVIDIA NIM endpoint.
- **Active Model Deployed**: `nvidia/nv-embedqa-e5-v5`
- **Output Vector Format**: `1024` floating-point dimensions.
- **API Endpoint**: `https://integrate.api.nvidia.com/v1/embeddings`
- **Payload Request Parameters**:
  ```json
  {
    "input": ["<User Search Query Text>"],
    "model": "nvidia/nv-embedqa-e5-v5",
    "input_type": "query",
    "encoding_format": "float",
    "truncate": "NONE"
  }
  ```
- **Error Handling & Fallbacks**: If the NVIDIA NIM endpoint experiences high latency or is unreachable, the system prints a warning to console logs, bypasses the vector search step cleanly, and falls back fully on PostgREST Full-Text Search (FTS) queries, avoiding service dropouts.

---

## 4. Zero-Hardcoding UI State Tracking

To eliminate obsolete data lists and maintain high listing reliability, the client UI implements a **Zero-Hardcoding architecture**. Categories and cities are not loaded from client-side configuration arrays; instead, they are dynamically aggregated directly from the active business rows in Supabase.

### Parallel Selection Collectors

The server side exposes two distinct lookup helpers (`getUniqueCategories` and `getUniqueCities`) that retrieve unique entries in parallel on component mount:

```typescript
export async function getUniqueCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;

    const unique = Array.from(new Set(data.map(item => item.category))) as string[];
    return unique.sort();
  } catch (err) {
    console.error("Failed to fetch unique categories:", err);
    return [];
  }
}

export async function getUniqueCities(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('city')
      .not('city', 'is', null);

    if (error) throw error;

    const unique = Array.from(new Set(data.map(item => item.city).filter(Boolean))) as string[];
    return unique.sort();
  } catch (err) {
    console.error("Failed to fetch unique cities:", err);
    return [];
  }
}
```

### React Mounting Hooks and UI State Mapping

On the client side (`components/DirectoryClient.tsx`), these dynamic filters are requested concurrently:

```typescript
const [searchQuery, setSearchQuery] = useState('');
const [selectedCategory, setSelectedCategory] = useState<string>('All');
const [selectedLocation, setSelectedLocation] = useState<string>('All');
const [availableCategories, setAvailableCategories] = useState<string[]>(['All']);
const [availableLocations, setAvailableLocations] = useState<string[]>(['All']);

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

### Form Input Rendering & Reactivity Trace
1. **Dropdown Layout Elements**: The form renders a text search input alongside two dropdown lists dynamically populated from `availableCategories` and `availableLocations`.
2. **Visual Aesthetics**: The location select element features a styled location pin indicator (📍) inside the container frame. The heights, padding, border parameters, font weights, and rounded borders (`rounded-2xl`) match the category selector element perfectly.
3. **Reactivity Triggers**:
   - The user typing in the text input updates the `searchQuery` state. Submitting the form triggers a manual query execution.
   - Selecting a different option in the category or location dropdown instantly updates their respective states.
   - A reactive `useEffect` hook listens to state updates on `selectedCategory` and `selectedLocation`, triggering search execution instantly upon user changes without requiring a manual click of the "Search" button.

---

## 5. Historical Migration & Troubleshooting Matrix

This matrix provides operational workflows to resolve common database state issues, schema caching delays, or dimension mismatch errors during hot upgrades:

| Issue / Error Code | Root Cause | System Impact | Standard Resolution Protocol |
| :--- | :--- | :--- | :--- |
| **PGRST204 Vector Dimension Mismatch** | A model transition occurred (e.g. changing from legacy 2048-D to active 1024-D model) without resizing the corresponding table column. | RPC requests abort instantly; database throws dimension inequality errors. | 1. Alter the database column width: `ALTER TABLE businesses ALTER COLUMN embedding TYPE vector(1024);`<br>2. Recompile and wipe Next.js compiler states: `rm -rf .next`<br>3. Force reload PostgREST schema cache to make column edits immediately visible. |
| **Supabase PostgREST Schema Delay** | The internal PostgREST router caches database schemas and does not dynamically discover altered parameters or new column names in real time. | Queries against updated RPC function signatures fail with missing column exceptions. | Flush the PostgREST cache manual registry by broadcasting a notify reload event in the Supabase SQL editor:<br>`NOTIFY pgrst, 'reload schema';` |
| **Old Cache Vector Dilution** | Legacy 2048-D embedding values remain written in the table after altering the column dimensions. | Attempting to write new 1024-D values results in length index violations, corrupting hybrid search. | Wipe all legacy vector caches clean before running the vector synchronization scripts:<br>`UPDATE businesses SET embedding = NULL;` |
| **Search Score Dilution** | Long, descriptive passages spread semantic density thin, causing short user search queries to score lower than short descriptions. | Cosine similarity distribution shifts, making relevant business listings rank lower. | Ensure consistent text formatting during vector sync backfills, merging structured keys (e.g., Brand + Category + Services + Description) to balance vector content representation. |
