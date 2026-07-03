-- Migration to implement database-level limits for Businesses and IMIS ID linkages

-- 1. Business Profile Limit function and trigger on public.businesses
CREATE OR REPLACE FUNCTION public.check_business_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role public.app_role;
  biz_count integer;
BEGIN
  -- Resolve owner_profile_id if NULL but owner_id exists (e.g. from Legacy inserts)
  IF NEW.owner_profile_id IS NULL AND NEW.owner_id IS NOT NULL THEN
    SELECT id INTO NEW.owner_profile_id FROM public.profiles WHERE user_id = NEW.owner_id;
  END IF;

  -- Only perform checks if owner_profile_id is resolved/provided
  IF NEW.owner_profile_id IS NOT NULL THEN
    -- Look up the app_role of the business owner
    SELECT app_role INTO user_role FROM public.profiles WHERE id = NEW.owner_profile_id;

    -- If user is admin (super_admin or region_admin), exempt them from the limit
    IF user_role = 'super_admin'::public.app_role OR user_role = 'region_admin'::public.app_role THEN
      RETURN NEW;
    END IF;

    -- Count existing businesses for this owner profile
    SELECT count(*) INTO biz_count FROM public.businesses WHERE owner_profile_id = NEW.owner_profile_id;

    -- Raise exception if standard user already has 5 or more profiles
    IF biz_count >= 5 THEN
      RAISE EXCEPTION 'BUSINESS_LIMIT_REACHED: You can only create a maximum of 5 business profiles.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_business_limit ON public.businesses;
CREATE TRIGGER trigger_check_business_limit
  BEFORE INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.check_business_limit();


-- 2. IMIS ID Limit function and trigger on public.profiles
CREATE OR REPLACE FUNCTION public.check_imis_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  imis_count integer;
BEGIN
  -- Check only if imis_id is not null and not empty after trimming
  IF NEW.imis_id IS NOT NULL AND trim(NEW.imis_id) <> '' THEN
    -- Count other profiles linked to the same imis_id
    SELECT count(*) INTO imis_count 
    FROM public.profiles 
    WHERE imis_id = NEW.imis_id AND id <> NEW.id;

    -- Raise exception if 5 or more accounts are already linked
    IF imis_count >= 5 THEN
      RAISE EXCEPTION 'IMIS_LIMIT_REACHED: A maximum of 5 accounts can link to this IMIS ID.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_imis_limit ON public.profiles;
CREATE TRIGGER trigger_check_imis_limit
  BEFORE INSERT OR UPDATE OF imis_id ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_imis_limit();
