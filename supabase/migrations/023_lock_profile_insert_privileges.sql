BEGIN;

-- Public visitors must have no direct profile-table access.
REVOKE ALL PRIVILEGES ON TABLE public.profiles FROM anon;

-- Authenticated users must not directly create or delete profile rows.
REVOKE INSERT, DELETE, REFERENCES, TRIGGER
ON TABLE public.profiles
FROM authenticated;

-- Remove any explicit protected-column privileges.
REVOKE INSERT (app_role), UPDATE (app_role), REFERENCES (app_role)
ON public.profiles
FROM anon, authenticated;

-- Authenticated users still need to read permitted profile rows through RLS.
GRANT SELECT ON TABLE public.profiles TO authenticated;

-- Authenticated users may update only ordinary personal-profile fields.
GRANT UPDATE (
  full_name,
  phone,
  imis_id,
  address,
  city,
  state,
  country,
  education,
  job_title
)
ON public.profiles
TO authenticated;

COMMIT;
