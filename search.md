# YMI Business Directory - Search Architecture Deep Dive

This document provides a highly detailed, comprehensive review of the entire search pipeline for the Y's Men International Business Directory. It traces the exact execution path from the frontend UI components down to the PostgreSQL vector math, ensuring 100% accuracy with the current implementation.

## 1. High-Level Architecture Overview

The YMI Directory search is built on a **Hybrid Search philosophy**, combining traditional Full-Text Search (keyword matching) with Semantic Vector Search (meaning/intent matching) using a mathematical approach known as **Reciprocal Rank Fusion (RRF)**.

### Tech Stack Mapping
*   **Frontend**: Next.js 15 Client Components (`DirectoryClient.tsx`).
*   **Middle-Tier**: Next.js Server Actions (`search.ts`, `getEmbedding.ts`) executing securely on the server.
*   **AI Engine**: NVIDIA NIM Pipeline (`nvidia/nv-embedqa-e5-v5`) for generating 1024-dimensional dense vector embeddings.
*   **Database-Tier**: Supabase PostgreSQL with the `pgvector` extension and custom RPCs for hybrid fusion.

---

## 2. The Frontend Client Flow (`DirectoryClient.tsx`)

The frontend search relies on React state management linked directly to form submissions, deliberately avoiding debouncing to give users explicit control over when an expensive hybrid search is triggered.

### Capturing User Input
The component maintains state for the query and category filter:
```tsx
const [searchQuery, setSearchQuery] = useState('');
const [selectedCategory, setSelectedCategory] = useState<string>('All');
const [isSearching, setIsSearching] = useState(false);
```

### State Management & Submission
Rather than debouncing every keystroke, the UI relies on an explicit `onSubmit` handler for the keyword search, while remaining immediately reactive to category changes.

```tsx
const handleSearch = async (e: React.FormEvent) => {
  e.preventDefault();
  await executeSearch(searchQuery, selectedCategory, true);
};

// Immediate Category Reactivity
React.useEffect(() => {
  executeSearch(searchQuery, selectedCategory, false);
}, [selectedCategory]);
```

### Calling the Backend & Fallback Logic
The frontend bypasses traditional API routes, invoking the Next.js Server Action `performHybridSearch` directly. Crucially, the frontend implements an **Automatic Fallback** mechanism: if a user searches within a specific category and gets zero results, it automatically widens the search to the entire directory.

```tsx
const executeSearch = async (query: string, category: string, isManual: boolean) => {
  // ...
  const results = await performHybridSearch(query, category);
  
  // Automatic Fallback: Wide Search (Only if keyword search failed)
  if (results.length === 0 && category !== 'All') {
    setIsWideSearch(true);
    const wideResults = await performHybridSearch(query, 'All');
    setBusinesses(wideResults);
  } else {
    setBusinesses(results);
  }
  // ...
};
```

---

## 3. The Middle-Tier: Next.js Server Actions

The middle tier is responsible for securely interacting with the NVIDIA API and Supabase, ensuring API keys are never exposed to the client.

### Execution Path: `app/actions/search.ts`

**1. Stage 1: Empty Query Bypass**
If the user hasn't typed a keyword, the system skips the expensive vector generation and simply queries Supabase directly by category, returning a perfect `1.0` score.
```typescript
if (!trimmedQuery) {
  let query = supabase.from('businesses').select('*');
  if (category && category !== 'All') {
    query = query.eq('category', category);
  }
  // ... returns data mapped with final_score: 1.0
}
```

**2. Vector Generation (`app/actions/getEmbedding.ts`)**
The server action dynamically builds the payload for the NVIDIA API.
*   **Endpoint**: `https://integrate.api.nvidia.com/v1/embeddings`
*   **Model**: `nvidia/nv-embedqa-e5-v5`
*   **Input Type**: `query` (or `passage` for insertion)

```typescript
const response = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    input: [text],
    model: "nvidia/nv-embedqa-e5-v5",
    input_type: inputType,
    encoding_format: "float",
    truncate: "NONE"
  })
});
```

**3. Dynamic Relational Drop-off Filter**
After calling the Supabase RPC, the server action dynamically filters out poor matches. Instead of a hardcoded threshold, it calculates the top score and drops any results that fall below 50% of the top scorer.

```typescript
const topScore = data[0].final_score;
const DROPOFF_THRESHOLD = 0.50;
const minimumAcceptableScore = topScore * DROPOFF_THRESHOLD;

const filteredResults = data.filter((business: any) => business.final_score >= minimumAcceptableScore);
```

---

## 4. The Database-Tier: Supabase & Postgres

The core of the search logic lives inside the database via the `hybrid_search_businesses` RPC, allowing the Postgres engine to handle the heavy math natively.

### Schema Details
The `businesses` table utilizes a highly precise 1024-dimensional vector column matching the output of the NVIDIA model.
```sql
embedding vector(1024)
```
> [!WARNING]
> Currently, there is no explicit HNSW (Hierarchical Navigable Small World) or IVFFlat index defined for the `embedding` column in the migration files. As the dataset scales, this will result in exact K-Nearest Neighbor (KNN) sequential scans, degrading performance. An HNSW index should be applied prior to mass scale.

### The `hybrid_search_businesses` RPC Breakdown

The RPC uses Common Table Expressions (CTEs) to execute the semantic and keyword searches in parallel before fusing them.

**1. Semantic Vector Match (`vector_matches`)**
It calculates the cosine distance (`<=>`) between the pre-computed business embeddings and the live query embedding, ranking them sequentially.
```sql
vector_matches as (
  select id, 1 - (embedding <=> query_embedding) as vector_similarity,
         rank() over (order by embedding <=> query_embedding) as rank
  from filtered_businesses
  where embedding is not null
)
```

**2. Full-Text Search Match (`text_matches`)**
It utilizes Postgres's native `ts_rank` and `to_tsvector`. It explicitly assigns weights to different columns to prioritize brand name over category or description.
*   `A` Weight: `brand_name`
*   `B` Weight: `category`
*   `C` Weight: `description`
```sql
text_matches as (
  select id, ts_rank(
    setweight(to_tsvector('english', coalesce(brand_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C'),
    websearch_to_tsquery('english', query_text)
  ) as text_score,
  rank() over (order by ts_rank(...) desc) as rank
  from filtered_businesses
  where query_text <> '' and websearch_to_tsquery('english', query_text) @@ (...)
)
```

**3. Reciprocal Rank Fusion (RRF)**
The final query outer-joins the two CTEs and mathematically fuses their ranks. It uses a standard constant of `60` in the denominator to smooth extreme outliers.
Crucially, the fusion is **weighted**: Semantic matches account for `70%` of the final score, while exact keyword matches account for `30%`.
```sql
select
  b.*,
  -- Reciprocal Rank Fusion (RRF) with weights (70% Semantic / 30% Keyword)
  (coalesce(1.0 / (60 + v.rank), 0.0) * 0.7) + (coalesce(1.0 / (60 + t.rank), 0.0) * 0.3) as final_score
from businesses b
left join vector_matches v on v.id = b.id
left join text_matches t on t.id = b.id
where v.id is not null or t.id is not null
order by final_score desc
limit match_count;
```

---

## 5. Known Limitations & Security

### Row Level Security (RLS) Interaction
The `performHybridSearch` server action utilizes `createServerClient` with the user's cookies and the `NEXT_PUBLIC_SUPABASE_ANON_KEY`. 
Because the RPC `hybrid_search_businesses` is declared as `language sql stable` (without the `security definer` modifier), it executes strictly under the context of the caller. Therefore, **all standard RLS policies on the `businesses` table are fully respected during the search**. Private or unverified businesses protected by RLS will not appear in the search results.

### NVIDIA API Failure / Fallback
If the NVIDIA API goes down, times out, or fails to return an embedding, the server action catches the error and assigns `null` to the `queryEmbedding`.
```typescript
if (!queryEmbedding) {
  console.warn("Semantic search unavailable, falling back to FTS");
}
```
When a `null` vector is passed to the RPC, the `vector_matches` CTE handles it gracefully by returning null values for vector comparisons. However, the `text_matches` CTE continues to function normally using `query_text`. The RRF math executes smoothly, effectively downgrading the architecture into a pure Full-Text Keyword Search engine until the NVIDIA API recovers.
