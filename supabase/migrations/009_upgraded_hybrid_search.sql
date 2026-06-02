-- 1. Drop the legacy function signatures to ensure a clean slate
DROP FUNCTION IF EXISTS public.hybrid_search_businesses(vector(1024), text, text, integer);
DROP FUNCTION IF EXISTS public.hybrid_search_businesses(vector(1024), text, text, text, integer);
DROP FUNCTION IF EXISTS public.hybrid_search_businesses(vector, text, text, integer);
DROP FUNCTION IF EXISTS public.hybrid_search_businesses(vector, text, text, text, integer);

-- 2. Create the upgraded hybrid search function with boost support and location filter
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