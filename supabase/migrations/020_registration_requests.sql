-- Migration: 020_registration_requests
-- Purpose: Add approval-based public registration submission and reviewer workflows.
-- Dependencies: 018_club_master.sql and 019_seed_swir_clubs_2025_26.sql.

CREATE TABLE IF NOT EXISTS public.registration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 150),
  email text NOT NULL CHECK (char_length(btrim(email)) <= 320),
  normalized_email text NOT NULL CHECK (
    normalized_email = lower(btrim(email))
    AND normalized_email <> ''
  ),
  phone text NOT NULL CHECK (char_length(btrim(phone)) BETWEEN 5 AND 30),
  member_imis_id text,
  club_id uuid NOT NULL REFERENCES public.swir_clubs(id) ON DELETE RESTRICT,
  address text,
  city text,
  state text,
  country text,
  education text,
  job_title text,
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'activated')
  ),
  submitted_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  reviewed_at timestamptz,
  reviewed_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  rejection_reason text,
  activated_at timestamptz,
  activated_profile_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  CONSTRAINT registration_review_state_check CHECK (
    (status = 'pending' AND reviewed_at IS NULL AND reviewed_by_profile_id IS NULL)
    OR (status IN ('approved', 'rejected', 'activated') AND reviewed_at IS NOT NULL AND reviewed_by_profile_id IS NOT NULL)
  ),
  CONSTRAINT registration_rejection_reason_check CHECK (
    (status = 'rejected' AND nullif(btrim(rejection_reason), '') IS NOT NULL)
    OR (status <> 'rejected' AND rejection_reason IS NULL)
  ),
  CONSTRAINT registration_activation_state_check CHECK (
    (status = 'activated' AND activated_at IS NOT NULL AND activated_profile_id IS NOT NULL)
    OR (status <> 'activated' AND activated_at IS NULL AND activated_profile_id IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_registration_requests_active_email
  ON public.registration_requests(normalized_email)
  WHERE status IN ('pending', 'approved', 'activated');
CREATE INDEX IF NOT EXISTS idx_registration_requests_status_submitted
  ON public.registration_requests(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_registration_requests_club_id
  ON public.registration_requests(club_id);

CREATE TABLE IF NOT EXISTS public.registration_request_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.registration_requests(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('approved', 'rejected', 'activated', 'login_conflict', 'login_denied')),
  previous_status text,
  new_status text,
  previous_club_id uuid REFERENCES public.swir_clubs(id) ON DELETE RESTRICT,
  new_club_id uuid REFERENCES public.swir_clubs(id) ON DELETE RESTRICT,
  actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reason text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_registration_request_audit_request
  ON public.registration_request_audit(request_id, created_at DESC);

ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_request_audit ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON public.registration_requests FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON public.registration_request_audit FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.registration_requests TO authenticated;
GRANT SELECT ON public.registration_request_audit TO authenticated;

DROP POLICY IF EXISTS select_registration_requests_reviewers ON public.registration_requests;
CREATE POLICY select_registration_requests_reviewers
ON public.registration_requests
FOR SELECT
TO authenticated
USING (
  (SELECT app_role FROM public.profiles WHERE user_id = auth.uid())
    IN ('review_admin'::public.app_role, 'super_admin'::public.app_role)
);

DROP POLICY IF EXISTS select_registration_request_audit_reviewers ON public.registration_request_audit;
CREATE POLICY select_registration_request_audit_reviewers
ON public.registration_request_audit
FOR SELECT
TO authenticated
USING (
  (SELECT app_role FROM public.profiles WHERE user_id = auth.uid())
    IN ('review_admin'::public.app_role, 'super_admin'::public.app_role)
);

CREATE OR REPLACE FUNCTION public.prevent_registration_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'Registration audit records are immutable.';
END;
$$;

DROP TRIGGER IF EXISTS trg_registration_audit_immutable ON public.registration_request_audit;
CREATE TRIGGER trg_registration_audit_immutable
BEFORE UPDATE OR DELETE ON public.registration_request_audit
FOR EACH ROW EXECUTE FUNCTION public.prevent_registration_audit_mutation();

CREATE OR REPLACE FUNCTION public.submit_registration_request(
  p_full_name text,
  p_email text,
  p_phone text,
  p_club_id uuid,
  p_member_imis_id text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_education text DEFAULT NULL,
  p_job_title text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  clean_name text := btrim(coalesce(p_full_name, ''));
  clean_email text := lower(btrim(coalesce(p_email, '')));
  clean_phone text := btrim(coalesce(p_phone, ''));
  generic_response constant text := 'If eligible, your registration request has been received for review.';
BEGIN
  IF char_length(clean_name) NOT BETWEEN 2 AND 150
    OR char_length(clean_email) NOT BETWEEN 3 AND 320
    OR clean_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    OR char_length(clean_phone) NOT BETWEEN 5 AND 30
    OR char_length(coalesce(p_member_imis_id, '')) > 100
    OR char_length(coalesce(p_address, '')) > 500
    OR char_length(coalesce(p_city, '')) > 120
    OR char_length(coalesce(p_state, '')) > 120
    OR char_length(coalesce(p_country, '')) > 120
    OR char_length(coalesce(p_education, '')) > 250
    OR char_length(coalesce(p_job_title, '')) > 150
  THEN
    RAISE EXCEPTION 'Invalid registration request.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.swir_clubs
    WHERE id = p_club_id AND is_selectable
  ) THEN
    RAISE EXCEPTION 'Invalid registration request.';
  END IF;

  -- Existing accounts and duplicate active requests receive the same public response.
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(btrim(email)) = clean_email
  ) OR EXISTS (
    SELECT 1 FROM public.registration_requests
    WHERE normalized_email = clean_email
      AND status IN ('pending', 'approved', 'activated')
  ) THEN
    RETURN generic_response;
  END IF;

  INSERT INTO public.registration_requests (
    full_name,
    email,
    normalized_email,
    phone,
    member_imis_id,
    club_id,
    address,
    city,
    state,
    country,
    education,
    job_title,
    status
  ) VALUES (
    clean_name,
    clean_email,
    clean_email,
    clean_phone,
    nullif(btrim(p_member_imis_id), ''),
    p_club_id,
    nullif(btrim(p_address), ''),
    nullif(btrim(p_city), ''),
    nullif(btrim(p_state), ''),
    nullif(btrim(p_country), ''),
    nullif(btrim(p_education), ''),
    nullif(btrim(p_job_title), ''),
    'pending'
  );

  RETURN generic_response;
EXCEPTION
  WHEN unique_violation THEN
    RETURN generic_response;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_registration_requests(p_status text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  phone text,
  member_imis_id text,
  club_id uuid,
  club_name text,
  imis_club_id text,
  district_number smallint,
  zone_number smallint,
  region_code text,
  submitted_at timestamptz,
  status text,
  reviewed_at timestamptz,
  reviewer_name text,
  rejection_reason text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_role public.app_role;
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

  IF p_status IS NOT NULL AND p_status NOT IN ('pending', 'approved', 'rejected', 'activated') THEN
    RAISE EXCEPTION 'Invalid status filter.';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.full_name,
    r.email,
    r.phone,
    r.member_imis_id,
    r.club_id,
    c.canonical_name,
    c.imis_club_id,
    c.district_number,
    c.zone_number,
    c.region_code,
    r.submitted_at,
    r.status,
    r.reviewed_at,
    reviewer.full_name,
    r.rejection_reason
  FROM public.registration_requests r
  JOIN public.swir_clubs c ON c.id = r.club_id
  LEFT JOIN public.profiles reviewer ON reviewer.id = r.reviewed_by_profile_id
  WHERE p_status IS NULL OR r.status = p_status
  ORDER BY r.submitted_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_registration_request(
  p_request_id uuid,
  p_requested_action text,
  p_rejection_reason text DEFAULT NULL,
  p_corrected_club_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_profile_id uuid;
  caller_role public.app_role;
  request_row public.registration_requests%ROWTYPE;
  final_club_id uuid;
  final_status text;
  clean_reason text := nullif(btrim(p_rejection_reason), '');
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

  IF p_requested_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Action must be approve or reject.';
  END IF;

  IF p_requested_action = 'reject' AND clean_reason IS NULL THEN
    RAISE EXCEPTION 'A rejection reason is required.';
  END IF;

  SELECT * INTO request_row
  FROM public.registration_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registration request not found.';
  END IF;

  IF request_row.status <> 'pending' THEN
    RAISE EXCEPTION 'Registration request has already been reviewed.';
  END IF;

  final_club_id := coalesce(p_corrected_club_id, request_row.club_id);
  IF NOT EXISTS (
    SELECT 1 FROM public.swir_clubs
    WHERE id = final_club_id AND is_selectable
  ) THEN
    RAISE EXCEPTION 'Invalid club selection.';
  END IF;

  final_status := CASE WHEN p_requested_action = 'approve' THEN 'approved' ELSE 'rejected' END;

  UPDATE public.registration_requests
  SET
    club_id = final_club_id,
    status = final_status,
    reviewed_at = timezone('utc'::text, now()),
    reviewed_by_profile_id = caller_profile_id,
    rejection_reason = CASE WHEN final_status = 'rejected' THEN clean_reason ELSE NULL END
  WHERE id = p_request_id;

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
    p_request_id,
    final_status,
    request_row.status,
    final_status,
    request_row.club_id,
    final_club_id,
    caller_profile_id,
    CASE WHEN final_status = 'rejected' THEN clean_reason ELSE NULL END
  );

  RETURN CASE
    WHEN final_status = 'approved' THEN 'Registration request approved.'
    ELSE 'Registration request rejected.'
  END;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_registration_audit_mutation() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.submit_registration_request(
  text, text, text, uuid, text, text, text, text, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_registration_request(
  text, text, text, uuid, text, text, text, text, text, text, text
) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.list_registration_requests(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_registration_requests(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.review_registration_request(uuid, text, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_registration_request(uuid, text, text, uuid)
  TO authenticated;
