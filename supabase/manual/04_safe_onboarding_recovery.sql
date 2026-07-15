-- YMBD safe onboarding recovery after migration 022.
-- Before running: disable the Before User Created Hook in Supabase Dashboard.
-- This restores an approval-aware auth.users trigger. It does not restore open signup.
-- It never deletes profiles, registration requests, businesses, or audit records.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  clean_email text := lower(btrim(coalesce(NEW.email, '')));
  approved_request public.registration_requests%ROWTYPE;
  new_profile_id uuid;
BEGIN
  IF clean_email = '' THEN
    RETURN NEW;
  END IF;

  -- Existing bound profiles need no recovery action.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Never bind over an existing profile automatically during recovery.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(btrim(email)) = clean_email) THEN
    INSERT INTO public.onboarding_auth_audit (
      auth_user_id, normalized_email, event_type, details
    ) VALUES (
      NEW.id, clean_email, 'login_conflict',
      'Recovery trigger found an existing email profile requiring manual binding review.'
    );
    RETURN NEW;
  END IF;

  SELECT * INTO approved_request
  FROM public.registration_requests
  WHERE normalized_email = clean_email
    AND status = 'approved'
  ORDER BY reviewed_at
  LIMIT 1
  FOR UPDATE;

  -- Unapproved auth users receive no profile and therefore no dashboard access.
  IF approved_request.id IS NULL THEN
    INSERT INTO public.onboarding_auth_audit (
      auth_user_id, normalized_email, event_type, details
    ) VALUES (
      NEW.id, clean_email, 'login_denied',
      'Recovery trigger found no approved registration request.'
    );
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (
    user_id, full_name, email, phone, imis_id, club_id, app_role,
    address, city, state, country, education, job_title, account_approved_at
  ) VALUES (
    NEW.id,
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
    previous_club_id, new_club_id, actor_profile_id,
    reason
  ) VALUES (
    approved_request.id, 'activated', 'approved', 'activated',
    approved_request.club_id, approved_request.club_id, new_profile_id,
    'Activated by the safe recovery trigger.'
  );

  INSERT INTO public.onboarding_auth_audit (
    auth_user_id, normalized_email, event_type, profile_id,
    registration_request_id, details
  ) VALUES (
    NEW.id, clean_email, 'activated', new_profile_id,
    approved_request.id, 'Activated by the safe recovery trigger.'
  );

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Recovery verification: the restored function must contain no hardcoded email.
SELECT
  pg_get_functiondef('public.handle_new_user()'::regprocedure) AS approval_aware_recovery_handler,
  has_table_privilege('anon', 'public.registration_requests', 'SELECT') AS anon_can_read_requests,
  has_table_privilege('anon', 'public.registration_requests', 'INSERT') AS anon_can_insert_requests;
