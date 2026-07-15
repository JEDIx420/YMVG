SELECT
  has_table_privilege(
    'anon',
    'public.profiles',
    'SELECT'
  ) AS anon_can_select_profiles,

  has_table_privilege(
    'anon',
    'public.profiles',
    'INSERT'
  ) AS anon_can_insert_profiles,

  has_table_privilege(
    'authenticated',
    'public.profiles',
    'INSERT'
  ) AS authenticated_can_insert_profiles,

  has_column_privilege(
    'authenticated',
    'public.profiles',
    'app_role',
    'UPDATE'
  ) AS authenticated_can_update_role,

  has_column_privilege(
    'authenticated',
    'public.profiles',
    'app_role',
    'INSERT'
  ) AS authenticated_can_insert_role,

  has_table_privilege(
    'authenticated',
    'public.profiles',
    'SELECT'
  ) AS authenticated_can_select_profiles;
