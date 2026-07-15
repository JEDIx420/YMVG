-- Migration: 016_public_directory_compatibility
-- Purpose: Setup public view, search RPC, and business-creation routine to support frontend cutover.
-- Assumptions: profiles table exists.
-- Transactional: Yes.
-- Dependencies: 015_role_security_and_audit.sql
-- Expected Production Impact: Safe creation of new API endpoints. No disruption to existing directory functions.

-- 1. Create public_businesses view exposing public columns only
CREATE OR REPLACE VIEW public.public_businesses 
WITH (security_barrier = true)
AS
SELECT 
    id,
    brand_name,
    owner_name,
    category,
    description,
    services,
    special_offer,
    contact_email,
    contact_phone,
    address,
    city,
    state,
    country,
    website_url,
    logo_url,
    primary_image_url,
    gallery_urls,
    brochure_url,
    tagline,
    sponsorship_tier,
    ym_region,
    ym_zone,
    ym_district,
    ym_club,
    ym_designation
FROM public.businesses;

-- Revoke all privileges on view first, then grant only SELECT to public visitors
REVOKE ALL PRIVILEGES ON public.public_businesses FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_businesses TO anon, authenticated;


-- 2. Create public.keyword_search_businesses() RPC
DROP FUNCTION IF EXISTS public.keyword_search_businesses(text, text, text, integer);

CREATE OR REPLACE FUNCTION public.keyword_search_businesses(
  query_text text,
  category_filter text default null,
  location_filter text default null,
  match_count int default 20
)
returns table (
  id uuid,
  owner_name text,
  contact_email text,
  contact_phone text,
  brand_name text,
  category text,
  description text,
  services text[],
  special_offer text,
  address text,
  city text,
  state text,
  country text,
  tagline text,
  website_url text,
  logo_url text,
  primary_image_url text,
  gallery_urls text[],
  brochure_url text,
  sponsorship_tier double precision,
  ym_region text,
  ym_zone text,
  ym_district text,
  ym_club text,
  ym_designation text,
  is_boosted boolean,
  search_score float
)
language plpgsql stable security definer
SET search_path = public, pg_temp
as $$
declare
  clean_query text;
  safe_limit int;
begin
  -- Validate and clamp inputs
  clean_query := left(trim(coalesce(query_text, '')), 100);
  safe_limit := least(greatest(coalesce(match_count, 20), 1), 50);

  return query
  with filtered_businesses as (
    select b.*
    from public.businesses b
    where (category_filter is null or category_filter = 'All' or b.category = category_filter)
      and (location_filter is null or location_filter = 'All' or b.city = location_filter)
  ),
  text_matches as (
    select b.id, ts_rank(
      setweight(to_tsvector('english', coalesce(b.brand_name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(b.category, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(b.description, '')), 'C'),
      websearch_to_tsquery('english', clean_query)
    ) as text_score
    from filtered_businesses b
    where clean_query <> '' and websearch_to_tsquery('english', clean_query) @@ (
      setweight(to_tsvector('english', coalesce(b.brand_name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(b.category, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(b.description, '')), 'C')
    )
  )
  select
    b.id,
    b.owner_name,
    b.contact_email,
    b.contact_phone,
    b.brand_name,
    b.category,
    b.description,
    b.services,
    b.special_offer,
    b.address,
    b.city,
    b.state,
    b.country,
    b.tagline,
    b.website_url,
    b.logo_url,
    b.primary_image_url,
    b.gallery_urls,
    b.brochure_url,
    b.sponsorship_tier,
    b.ym_region,
    b.ym_zone,
    b.ym_district,
    b.ym_club,
    b.ym_designation,
    (ac.id is not null) as is_boosted,
    (t.text_score * coalesce(ac.boost_multiplier, 1.0))::float as search_score
  from text_matches t
  join public.businesses b on b.id = t.id
  left join public.ad_campaigns ac on ac.business_id = b.id 
    and ac.status = 'active'
    and now() between ac.start_date and ac.end_date
  order by is_boosted desc, search_score desc
  limit safe_limit;
end;
$$;

-- Revoke and grant execute on keyword search RPC
REVOKE EXECUTE ON FUNCTION public.keyword_search_businesses(text, text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.keyword_search_businesses(text, text, text, integer) TO anon, authenticated;


-- 3. Create public.create_my_business() RPC
-- Dropping existing signature first to allow parameter changes
DROP FUNCTION IF EXISTS public.create_my_business(
  text, text, text, text[], text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text
);

CREATE OR REPLACE FUNCTION public.create_my_business(
  brand_name text,
  category text,
  description text,
  services text[],
  special_offer text,
  address text,
  city text,
  state text,
  country text,
  contact_phone text,
  contact_email text,
  website_url text,
  logo_url text,
  primary_image_url text,
  gallery_urls text[],
  brochure_url text,
  tagline text,
  ym_region text,
  ym_zone text,
  ym_district text,
  ym_club text,
  ym_designation text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
declare
  caller_user_id uuid;
  caller_profile_id uuid;
  caller_name text;
  caller_email text;
  caller_phone text;
  business_count int;
  new_business_id uuid;
begin
  caller_user_id := auth.uid();
  if caller_user_id is null then
    raise exception 'Unauthorized: Authentication required.';
  end if;

  -- 1. Resolve caller profile details
  SELECT id, full_name, email, phone INTO caller_profile_id, caller_name, caller_email, caller_phone
  FROM public.profiles
  WHERE user_id = caller_user_id;

  if caller_profile_id is null then
    raise exception 'Profile Not Found: User profile must exist to register a business.';
  end if;

  -- 2. Enforce five-business limit
  SELECT count(*)::int INTO business_count
  FROM public.businesses
  WHERE owner_id = caller_user_id;

  if business_count >= 5 then
    raise exception 'Limit Exceeded: You have reached the maximum limit of 5 business profiles.';
  end if;

  -- 3. Insert listing deriving all sensitive parameters server-side
  INSERT INTO public.businesses (
    brand_name,
    category,
    description,
    services,
    special_offer,
    address,
    city,
    state,
    country,
    contact_phone,
    contact_email,
    website_url,
    logo_url,
    primary_image_url,
    gallery_urls,
    brochure_url,
    tagline,
    ym_region,
    ym_zone,
    ym_district,
    ym_club,
    ym_designation,
    owner_id,
    owner_profile_id,
    owner_name,
    owner_email,
    owner_phone,
    sponsorship_tier
  ) VALUES (
    brand_name,
    category,
    description,
    services,
    special_offer,
    address,
    city,
    state,
    country,
    contact_phone,
    contact_email,
    website_url,
    logo_url,
    primary_image_url,
    gallery_urls,
    brochure_url,
    tagline,
    ym_region,
    ym_zone,
    ym_district,
    ym_club,
    ym_designation,
    caller_user_id,
    caller_profile_id,
    coalesce(caller_name, split_part(caller_email, '@', 1), 'Unknown Owner'),
    caller_email,
    caller_phone,
    0.0 -- Standard unsponsored default tier
  )
  RETURNING id INTO new_business_id;

  -- 4. Promote owner if currently 'member'
  PERFORM public.promote_to_business_owner();

  return new_business_id;
end;
$$;

-- Revoke and grant execute on create_my_business RPC
REVOKE EXECUTE ON FUNCTION public.create_my_business(
  text, text, text, text[], text, text, text, text, text, text, text, text, text, text, text[], text, text, text, text, text, text, text
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_my_business(
  text, text, text, text[], text, text, text, text, text, text, text, text, text, text, text[], text, text, text, text, text, text, text
) TO authenticated;
