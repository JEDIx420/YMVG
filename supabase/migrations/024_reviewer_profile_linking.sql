-- Migration: 024_reviewer_profile_linking
-- Purpose: Add reviewer-controlled candidate search, cross-email profile linking, and preserve existing roles during activation.
-- Dependencies: 020_registration_requests.sql, 021_approved_member_activation.sql, 022_login_final_cutover.sql, 023_lock_profile_insert_privileges.sql.

-- 1. Candidate Profile Search RPC for Reviewers
CREATE OR REPLACE FUNCTION public.find_registration_profile_candidates(
  p_request_id uuid,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  profile_id uuid,
  full_name text,
  email text,
  phone text,
  imis_id text,
  club_id uuid,
  club_name text,
  app_role public.app_role,
  has_auth_binding boolean,
  owned_business_count integer,
  match_reasons text[],
  match_strength text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_role public.app_role;
  request_row public.registration_requests%ROWTYPE;
  clean_search text := nullif(lower(btrim(coalesce(p_search, ''))), '');
  req_email text;
  req_phone text;
  req_imis text;
  req_name text;
BEGIN
  SELECT app_role INTO caller_role
  FROM public.profiles
  WHERE user_id = auth.uid();

  IF caller_role IS NULL OR caller_role NOT IN (
    'review_admin'::public.app_role,
    'super_admin'::public.app_role
  ) THEN
    RAISE EXCEPTION 'Reviewer permissions required.';
  END IF;

  SELECT * INTO request_row
  FROM public.registration_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registration request not found.';
  END IF;

  req_email := request_row.normalized_email;
  req_phone := lower(btrim(coalesce(request_row.phone, '')));
  req_imis := nullif(btrim(coalesce(request_row.member_imis_id, '')), '');
  req_name := lower(btrim(coalesce(request_row.full_name, '')));

  RETURN QUERY
  WITH profile_matches AS (
    SELECT
      p.id AS p_id,
      p.full_name AS p_full_name,
      p.email AS p_email,
      p.phone AS p_phone,
      p.imis_id AS p_imis_id,
      p.club_id AS p_club_id,
      c.canonical_name AS p_club_name,
      p.app_role AS p_app_role,
      (p.user_id IS NOT NULL) AS p_has_auth,
      (
        SELECT count(*)::integer
        FROM public.businesses b
        WHERE b.owner_profile_id = p.id OR (p.user_id IS NOT NULL AND b.owner_id = p.user_id)
      ) AS p_biz_count,
      ARRAY_REMOVE(ARRAY[
        CASE WHEN lower(btrim(p.email)) = req_email THEN 'exact_email' ELSE NULL END,
        CASE WHEN req_phone <> '' AND lower(btrim(coalesce(p.phone, ''))) = req_phone THEN 'exact_phone' ELSE NULL END,
        CASE WHEN req_imis IS NOT NULL AND btrim(coalesce(p.imis_id, '')) = req_imis THEN 'exact_imis_id' ELSE NULL END,
        CASE WHEN req_name <> '' AND lower(btrim(coalesce(p.full_name, ''))) = req_name THEN 'exact_name' ELSE NULL END,
        CASE WHEN p.club_id = request_row.club_id THEN 'same_club' ELSE NULL END,
        CASE WHEN clean_search IS NOT NULL AND (
          lower(btrim(p.email)) ILIKE '%' || clean_search || '%' OR
          lower(btrim(coalesce(p.full_name, ''))) ILIKE '%' || clean_search || '%' OR
          lower(btrim(coalesce(p.phone, ''))) ILIKE '%' || clean_search || '%' OR
          lower(btrim(coalesce(p.imis_id, ''))) ILIKE '%' || clean_search || '%'
        ) THEN 'manual_search' ELSE NULL END
      ], NULL) AS p_reasons
    FROM public.profiles p
    LEFT JOIN public.swir_clubs c ON c.id = p.club_id
  )
  SELECT
    pm.p_id,
    pm.p_full_name,
    pm.p_email,
    pm.p_phone,
    pm.p_imis_id,
    pm.p_club_id,
    pm.p_club_name,
    pm.p_app_role,
    pm.p_has_auth,
    pm.p_biz_count,
    pm.p_reasons,
    CASE
      WHEN 'exact_email' = ANY(pm.p_reasons)
        OR 'exact_phone' = ANY(pm.p_reasons)
        OR 'exact_imis_id' = ANY(pm.p_reasons) THEN 'high'
      WHEN 'exact_name' = ANY(pm.p_reasons) THEN 'medium'
      ELSE 'low'
    END AS match_strength
  FROM profile_matches pm
  WHERE array_length(pm.p_reasons, 1) > 0
    AND (
      clean_search IS NULL
      OR 'manual_search' = ANY(pm.p_reasons)
      OR 'exact_email' = ANY(pm.p_reasons)
      OR 'exact_phone' = ANY(pm.p_reasons)
      OR 'exact_imis_id' = ANY(pm.p_reasons)
      OR 'exact_name' = ANY(pm.p_reasons)
    )
  ORDER BY
    CASE
      WHEN 'exact_email' = ANY(pm.p_reasons) OR 'exact_phone' = ANY(pm.p_reasons) OR 'exact_imis_id' = ANY(pm.p_reasons) THEN 1
      WHEN 'exact_name' = ANY(pm.p_reasons) THEN 2
      ELSE 3
    END,
    pm.p_full_name
  LIMIT 20;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.find_registration_profile_candidates(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_registration_profile_candidates(uuid, text)
  TO authenticated;

-- 2. Explicit Profile-Linking RPC for Reviewers
CREATE OR REPLACE FUNCTION public.link_registration_request_to_existing_profile(
  p_request_id uuid,
  p_profile_id uuid
)
RETURNS TABLE (
  profile_id uuid,
  preserved_profile_email text,
  request_email text,
  preserved_role public.app_role,
  club_name text,
  district_number smallint,
  zone_number smallint,
  region_code text,
  request_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_profile_id uuid;
  caller_role public.app_role;
  request_row public.registration_requests%ROWTYPE;
  target_profile public.profiles%ROWTYPE;
  target_club public.swir_clubs%ROWTYPE;
BEGIN
  SELECT id, app_role INTO caller_profile_id, caller_role
  FROM public.profiles
  WHERE user_id = auth.uid();

  IF caller_profile_id IS NULL OR caller_role NOT IN (
    'review_admin'::public.app_role,
    'super_admin'::public.app_role
  ) THEN
    RAISE EXCEPTION 'Reviewer permissions required.';
  END IF;

  IF p_profile_id IS NULL THEN
    RAISE EXCEPTION 'Target profile ID is required.';
  END IF;

  SELECT * INTO request_row
  FROM public.registration_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registration request not found.';
  END IF;

  IF request_row.status NOT IN ('pending', 'approved') THEN
    RAISE EXCEPTION 'Only pending or approved registration requests can be linked.';
  END IF;

  SELECT * INTO target_profile
  FROM public.profiles
  WHERE id = p_profile_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target profile not found.';
  END IF;

  -- Prevent linking if request email already belongs to a DIFFERENT existing profile
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(btrim(email)) = request_row.normalized_email
      AND id <> target_profile.id
  ) THEN
    RAISE EXCEPTION 'Request email belongs to a different existing profile.';
  END IF;

  -- Reject if target profile is unbound (user_id IS NULL) and email differs from request email
  IF target_profile.user_id IS NULL AND lower(btrim(target_profile.email)) <> request_row.normalized_email THEN
    RAISE EXCEPTION 'Cannot link an unbound legacy profile under a different email without prior authentication binding.';
  END IF;

  SELECT * INTO target_club
  FROM public.swir_clubs
  WHERE id = request_row.club_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid club selection on registration request.';
  END IF;

  -- Apply transaction-local permissions for club change and account activation.
  PERFORM set_config('public.allow_club_change', 'true', true);
  PERFORM set_config('public.allow_account_activation', 'true', true);

  -- Update target profile fields without modifying email, app_role, user_id, or created_at.
  UPDATE public.profiles
  SET
    full_name = coalesce(nullif(btrim(request_row.full_name), ''), target_profile.full_name),
    phone = coalesce(nullif(btrim(request_row.phone), ''), target_profile.phone),
    imis_id = coalesce(nullif(btrim(request_row.member_imis_id), ''), target_profile.imis_id),
    club_id = request_row.club_id,
    address = coalesce(nullif(btrim(request_row.address), ''), target_profile.address),
    city = coalesce(nullif(btrim(request_row.city), ''), target_profile.city),
    state = coalesce(nullif(btrim(request_row.state), ''), target_profile.state),
    country = coalesce(nullif(btrim(request_row.country), ''), target_profile.country),
    education = coalesce(nullif(btrim(request_row.education), ''), target_profile.education),
    job_title = coalesce(nullif(btrim(request_row.job_title), ''), target_profile.job_title),
    account_approved_at = coalesce(target_profile.account_approved_at, timezone('utc'::text, now()))
  WHERE id = target_profile.id;

  -- Mark registration request activated
  UPDATE public.registration_requests
  SET
    status = 'activated',
    activated_at = timezone('utc'::text, now()),
    activated_profile_id = target_profile.id,
    reviewed_at = coalesce(request_row.reviewed_at, timezone('utc'::text, now())),
    reviewed_by_profile_id = coalesce(request_row.reviewed_by_profile_id, caller_profile_id)
  WHERE id = request_row.id;

  -- Write registration request audit
  INSERT INTO public.registration_request_audit (
    request_id,
    action,
    previous_status,
    new_status,
    previous_club_id,
    new_club_id,
    actor_profile_id,
    reason
  ) VALUES (
    request_row.id,
    'activated',
    request_row.status,
    'activated',
    request_row.club_id,
    request_row.club_id,
    caller_profile_id,
    'Linked to existing profile ID: ' || target_profile.id::text
  );

  -- Write onboarding auth audit record
  INSERT INTO public.onboarding_auth_audit (
    auth_user_id,
    normalized_email,
    event_type,
    profile_id,
    registration_request_id,
    details
  ) VALUES (
    target_profile.user_id,
    request_row.normalized_email,
    'activated',
    target_profile.id,
    request_row.id,
    'Reviewer linked request ' || request_row.normalized_email || ' to profile ' || target_profile.email
  );

  RETURN QUERY
  SELECT
    target_profile.id,
    target_profile.email,
    request_row.normalized_email,
    target_profile.app_role,
    target_club.canonical_name,
    target_club.district_number,
    target_club.zone_number,
    target_club.region_code,
    'activated'::text;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.link_registration_request_to_existing_profile(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_registration_request_to_existing_profile(uuid, uuid)
  TO authenticated;

-- 3. Replace activate_approved_member() to preserve existing app_role during activation
CREATE OR REPLACE FUNCTION public.activate_approved_member()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_user_id uuid := auth.uid();
  verified_email text;
  clean_email text;
  caller_profile public.profiles%ROWTYPE;
  email_profile public.profiles%ROWTYPE;
  approved_request public.registration_requests%ROWTYPE;
  matching_profile_count integer;
  new_profile_id uuid;
BEGIN
  IF caller_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT u.email INTO verified_email
  FROM auth.users u
  WHERE u.id = caller_user_id
    AND u.email IS NOT NULL
    AND u.email_confirmed_at IS NOT NULL;

  clean_email := lower(btrim(coalesce(verified_email, '')));
  IF clean_email = '' THEN
    RETURN false;
  END IF;

  SELECT * INTO caller_profile
  FROM public.profiles
  WHERE user_id = caller_user_id
  FOR UPDATE;

  -- Existing accounts approved during compatibility backfill always continue.
  IF FOUND AND caller_profile.account_approved_at IS NOT NULL THEN
    RETURN true;
  END IF;

  -- During Stage 2 the old trigger can create a provisional profile. It may only
  -- become approved by consuming an approved request for the verified email.
  IF caller_profile.id IS NOT NULL THEN
    IF lower(btrim(caller_profile.email)) <> clean_email THEN
      INSERT INTO public.onboarding_auth_audit (
        auth_user_id, normalized_email, event_type, profile_id, details
      ) VALUES (
        caller_user_id, clean_email, 'login_conflict', caller_profile.id,
        'Provisional profile email did not match the verified authentication email.'
      );
      RETURN false;
    END IF;

    SELECT * INTO approved_request
    FROM public.registration_requests
    WHERE normalized_email = clean_email
      AND status = 'approved'
    ORDER BY reviewed_at
    LIMIT 1
    FOR UPDATE;

    IF approved_request.id IS NULL THEN
      INSERT INTO public.onboarding_auth_audit (
        auth_user_id, normalized_email, event_type, profile_id, details
      ) VALUES (
        caller_user_id, clean_email, 'login_denied', caller_profile.id,
        'Provisional profile had no approved registration request.'
      );
      RETURN false;
    END IF;

    -- Preserve caller_profile.app_role without demoting or creating role_audit rows.
    PERFORM set_config('public.allow_account_activation', 'true', true);
    PERFORM set_config('public.allow_club_change', 'true', true);

    UPDATE public.profiles
    SET
      full_name = coalesce(nullif(btrim(approved_request.full_name), ''), caller_profile.full_name),
      phone = coalesce(nullif(btrim(approved_request.phone), ''), caller_profile.phone),
      imis_id = coalesce(nullif(btrim(approved_request.member_imis_id), ''), caller_profile.imis_id),
      club_id = approved_request.club_id,
      address = coalesce(nullif(btrim(approved_request.address), ''), caller_profile.address),
      city = coalesce(nullif(btrim(approved_request.city), ''), caller_profile.city),
      state = coalesce(nullif(btrim(approved_request.state), ''), caller_profile.state),
      country = coalesce(nullif(btrim(approved_request.country), ''), caller_profile.country),
      education = coalesce(nullif(btrim(approved_request.education), ''), caller_profile.education),
      job_title = coalesce(nullif(btrim(approved_request.job_title), ''), caller_profile.job_title),
      account_approved_at = timezone('utc'::text, now())
    WHERE id = caller_profile.id;

    UPDATE public.registration_requests
    SET
      status = 'activated',
      activated_at = timezone('utc'::text, now()),
      activated_profile_id = caller_profile.id
    WHERE id = approved_request.id;

    INSERT INTO public.registration_request_audit (
      request_id, action, previous_status, new_status,
      previous_club_id, new_club_id, actor_profile_id
    ) VALUES (
      approved_request.id, 'activated', 'approved', 'activated',
      approved_request.club_id, approved_request.club_id, caller_profile.id
    );

    INSERT INTO public.onboarding_auth_audit (
      auth_user_id, normalized_email, event_type, profile_id, registration_request_id
    ) VALUES (
      caller_user_id, clean_email, 'activated', caller_profile.id, approved_request.id
    );
    RETURN true;
  END IF;

  SELECT count(*)::integer INTO matching_profile_count
  FROM public.profiles
  WHERE lower(btrim(email)) = clean_email;

  IF matching_profile_count > 1 THEN
    INSERT INTO public.onboarding_auth_audit (
      auth_user_id, normalized_email, event_type, details
    ) VALUES (
      caller_user_id, clean_email, 'login_conflict',
      'More than one profile matched the verified email.'
    );
    RETURN false;
  END IF;

  SELECT * INTO email_profile
  FROM public.profiles
  WHERE lower(btrim(email)) = clean_email
  LIMIT 1
  FOR UPDATE;

  IF email_profile.id IS NOT NULL THEN
    IF email_profile.user_id IS NOT NULL AND email_profile.user_id <> caller_user_id THEN
      INSERT INTO public.onboarding_auth_audit (
        auth_user_id, normalized_email, event_type, profile_id, details
      ) VALUES (
        caller_user_id, clean_email, 'login_conflict', email_profile.id,
        'Verified email is already bound to a different auth user.'
      );
      RETURN false;
    END IF;

    PERFORM set_config('public.allow_profile_binding', 'true', true);
    PERFORM set_config('public.allow_account_activation', 'true', true);
    UPDATE public.profiles
    SET
      user_id = caller_user_id,
      account_approved_at = coalesce(account_approved_at, timezone('utc'::text, now()))
    WHERE id = email_profile.id;

    INSERT INTO public.onboarding_auth_audit (
      auth_user_id, normalized_email, event_type, profile_id
    ) VALUES (
      caller_user_id, clean_email, 'profile_bound', email_profile.id
    );
    RETURN true;
  END IF;

  SELECT * INTO approved_request
  FROM public.registration_requests
  WHERE normalized_email = clean_email
    AND status = 'approved'
  ORDER BY reviewed_at
  LIMIT 1
  FOR UPDATE;

  IF approved_request.id IS NULL THEN
    INSERT INTO public.onboarding_auth_audit (
      auth_user_id, normalized_email, event_type, details
    ) VALUES (
      caller_user_id, clean_email, 'login_denied',
      'No existing profile or approved registration request matched.'
    );
    RETURN false;
  END IF;

  -- Only new profile creation assigns app_role = 'member'
  INSERT INTO public.profiles (
    user_id,
    full_name,
    email,
    phone,
    imis_id,
    club_id,
    app_role,
    address,
    city,
    state,
    country,
    education,
    job_title,
    account_approved_at
  ) VALUES (
    caller_user_id,
    approved_request.full_name,
    clean_email,
    approved_request.phone,
    approved_request.member_imis_id,
    approved_request.club_id,
    'member'::public.app_role,
    approved_request.address,
    approved_request.city,
    approved_request.state,
    approved_request.country,
    approved_request.education,
    approved_request.job_title,
    timezone('utc'::text, now())
  )
  RETURNING id INTO new_profile_id;

  UPDATE public.registration_requests
  SET
    status = 'activated',
    activated_at = timezone('utc'::text, now()),
    activated_profile_id = new_profile_id
  WHERE id = approved_request.id;

  INSERT INTO public.registration_request_audit (
    request_id, action, previous_status, new_status,
    previous_club_id, new_club_id, actor_profile_id
  ) VALUES (
    approved_request.id, 'activated', 'approved', 'activated',
    approved_request.club_id, approved_request.club_id, new_profile_id
  );

  INSERT INTO public.onboarding_auth_audit (
    auth_user_id, normalized_email, event_type, profile_id, registration_request_id
  ) VALUES (
    caller_user_id, clean_email, 'activated', new_profile_id, approved_request.id
  );

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.activate_approved_member() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_approved_member() TO authenticated;
