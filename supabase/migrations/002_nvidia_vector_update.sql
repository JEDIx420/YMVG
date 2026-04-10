-- Drop the old similarity match function
drop function if exists match_businesses;

-- Alter the embedding column to 2048 dimensions (NVIDIA LLaMA 3.2 300m size)
alter table businesses 
  alter column embedding type vector(2048);

-- Recreate the match_businesses function with the fresh dimension size and hardcoded 0.3 threshold
create or replace function match_businesses (
  query_embedding vector(2048),
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
  select
    businesses.*,
    1 - (businesses.embedding <=> query_embedding) as similarity
  from businesses
  where 1 - (businesses.embedding <=> query_embedding) > 0.3
  order by (businesses.embedding <=> query_embedding) asc
  limit match_count;
$$;
