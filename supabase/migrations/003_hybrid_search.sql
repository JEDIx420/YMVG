-- Drop the old similarity function
drop function if exists match_businesses;

-- Recreate match_businesses as a true Hybrid Search utilizing Reciprocal Rank Fusion (RRF)
create or replace function match_businesses(
  query_embedding vector(2048),
  query_text text,
  match_count int
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
  embedding vector(2048),
  similarity float
)
language sql stable
as $$
  with vector_matches as (
    select id, rank() over (order by embedding <=> query_embedding) as rank
    from businesses
    where embedding is not null
  ),
  text_matches as (
    select id, rank() over (order by ts_rank(
      setweight(to_tsvector('english', coalesce(brand_name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(category, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'C'),
      websearch_to_tsquery('english', query_text)
    ) desc) as rank
    from businesses
    where query_text <> '' and websearch_to_tsquery('english', query_text) @@ (
      setweight(to_tsvector('english', coalesce(brand_name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(category, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'C')
    )
  )
  select
    b.*,
    coalesce(1.0 / (60 + v.rank), 0.0) + coalesce(1.0 / (60 + t.rank), 0.0) as similarity
  from businesses b
  left join vector_matches v on v.id = b.id
  left join text_matches t on t.id = b.id
  where v.id is not null or t.id is not null
  order by similarity desc
  limit match_count;
$$;
