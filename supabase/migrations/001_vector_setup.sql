-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create the match_businesses function for similarity checking
create or replace function match_businesses (
  query_embedding vector(384),
  match_threshold float,
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
  embedding vector(384),
  similarity float
)
language sql stable
as $$
  select
    businesses.*,
    1 - (businesses.embedding <=> query_embedding) as similarity
  from businesses
  where 1 - (businesses.embedding <=> query_embedding) > match_threshold
  order by (businesses.embedding <=> query_embedding) asc
  limit match_count;
$$;
