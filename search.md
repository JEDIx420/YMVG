# Semantic Search Post-Mortem & Audit

A deep dive into why Semantic Search is failing silently in production, returning 0 results instead of falling back to Full-Text Search.

## 1. The Search Execution Flow (`app/actions/search.ts`)

When a user searches for something like `"construction companies"`, the text flows into `search.ts`.

### Tracing the Embedding Call
```typescript
const trimmedQuery = searchText.trim();

// Stage 2: Hybrid Search with AI & Vector RPC
const queryEmbedding = await getEmbedding(trimmedQuery);

if (!queryEmbedding) {
  console.error("Failed to generate embedding for search");
  return []; // CRITICAL ERROR HUB
}
```

**CRITICAL FINDING:**
The error handling here is fundamentally broken for a "Hybrid" search! 
If `getEmbedding` returns `null` (e.g., NVIDIA API rate limit, network timeout, missing API key), the code actively blocks the execution flow and returns an empty array `[]` immediately. 

It completely abandons the Supabase RPC execution. This means if Semantic Search fails, Full-Text Search is inherently blocked from stepping in as a fallback. 

### The Blocked RPC Execution
If the vector generation *does* succeed, it executes the following RPC:
```typescript
const { data, error } = await supabase.rpc('hybrid_search_businesses', {
  query_embedding: queryEmbedding,
  query_text: trimmedQuery,
  category_filter: category === 'All' ? null : category,
  match_count: 20
});
```

---

## 2. The Embedding Utility (`getEmbedding.ts`)

Let's look at why `queryEmbedding` might fail and return `null`.

### API Networking & Logging
```typescript
const response = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    input: [text],
    model: "nvidia/llama-3.2-nemoretriever-300m-embed-v1",
    input_type: inputType,
    encoding_format: "float",
    truncate: "NONE"
  })
});

const data = await response.json();
if (data.data && data.data[0] && data.data[0].embedding) {
  return data.data[0].embedding as number[];
}

console.error("NVIDIA Embedded API Error:", data);
return null;
```

**Observation:** 
The utility does not check for HTTP Status Codes (e.g., `if (!response.ok)`). If NVIDIA returns a 429 Too Many Requests or a 500 Server Error as HTML instead of JSON, `response.json()` will hard-crash instead of falling back gracefully.

---

## 3. Frontend Highlighting Logic

The `DirectoryClient.tsx` highlights text matching the user's query:

```typescript
<div className="text-sm text-slate-600 line-clamp-3 mb-4 font-light leading-relaxed">
  <Highlight text={business.description} query={searchQuery} />
</div>
```

**Observation:** 
The `<Highlight />` component does not interfere with the results array or the number of items shown. The lack of search results is solely caused by `search.ts` instantly returning `[]` and skipping the Postgres query entirely.

---

## 4. Actionable Database Verification Query

To ensure the "NEXUS ADMIN Sync" successfully wrote the AI vectors to your database, open your Supabase SQL Editor and run this:

```sql
SELECT 
  count(*) as total_businesses,
  count(embedding) as successfully_vectorized,
  count(*) filter (where embedding is null) as missing_vectors
FROM businesses;
```

If `missing_vectors` is greater than 0, your database is missing semantic data.

---

## 5. The Current DBA RPC Implementation

The Database Admin updated the live RPC manually to utilize `halfvec` for index limits. Below is the active schema structure they deployed directly to production:

```sql
create or replace function hybrid_search_businesses(
  query_embedding vector(2048), -- OR halfvec(2048)
  query_text text,
  category_filter text default null,
  match_count int default 20
)
returns table ( ... )
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
    and embedding <=> query_embedding < 0.55 -- DBA enforced threshold
  ),
  -- (Text Matches and RRF remain identical)
$$;
```

## Summary Action Plan
1. **Remove the `return []` block**: `search.ts` must allow `queryEmbedding` to pass as `null` into the RPC if the NVIDIA API fails. 
2. **Update RPC to handle NULL Vectors**: The `hybrid_search_businesses` RPC must gracefully fallback to pure Full-Text Search if `query_embedding` evaluates to NULL.
