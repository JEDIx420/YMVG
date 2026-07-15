# YMBD Production Security Database Audit Scripts

This directory contains a suite of strictly read-only SQL scripts to audit your production Supabase database instance. Each file contains catalog queries to extract structural and security configurations.

## Run Order and Details

1.  **[01_extensions.sql](file:///Users/vincyvincent/ymbd/supabase/audit/01_extensions.sql)**: Lists active database extensions (like `vector`) and PG engine details.
2.  **[02_schema.sql](file:///Users/vincyvincent/ymbd/supabase/audit/02_schema.sql)**: Resolves columns, defaults, types (including arrays), and generated fields.
3.  **[03_rls_status.sql](file:///Users/vincyvincent/ymbd/supabase/audit/03_rls_status.sql)**: Verifies if Row-Level Security is active and forced on tables.
4.  **[04_rls_policies.sql](file:///Users/vincyvincent/ymbd/supabase/audit/04_rls_policies.sql)**: Audits policy definitions, USING rules, and WITH CHECK requirements.
5.  **[05_table_grants.sql](file:///Users/vincyvincent/ymbd/supabase/audit/05_table_grants.sql)**: Inspects table-level privileges assigned to default Supabase roles.
6.  **[06_column_grants.sql](file:///Users/vincyvincent/ymbd/supabase/audit/06_column_grants.sql)**: Audits explicit column-level grants.
7.  **[07_functions_inventory.sql](file:///Users/vincyvincent/ymbd/supabase/audit/07_functions_inventory.sql)**: Lists database functions, execution permissions, owners, and settings.
8.  **[08_function_definitions.sql](file:///Users/vincyvincent/ymbd/supabase/audit/08_function_definitions.sql)**: Extracts the full SQL source definition of targeted functions.
9.  **[09_triggers.sql](file:///Users/vincyvincent/ymbd/supabase/audit/09_triggers.sql)**: Inspects active triggers across `public`, `auth`, and `storage` schemas.
10. **[10_indexes_constraints.sql](file:///Users/vincyvincent/ymbd/supabase/audit/10_indexes_constraints.sql)**: Lists index definitions and constraint configurations.
11. **[11_db_schemas.sql](file:///Users/vincyvincent/ymbd/supabase/audit/11_db_schemas.sql)**: Checks PostgREST schema configurations and search paths.
12. **[12_storage_buckets.sql](file:///Users/vincyvincent/ymbd/supabase/audit/12_storage_buckets.sql)**: Identifies configured storage buckets and their public flag.
13. **[13_storage_policies_grants.sql](file:///Users/vincyvincent/ymbd/supabase/audit/13_storage_policies_grants.sql)**: Audits RLS policy definitions on storage.
14. **[14_audited_routines.sql](file:///Users/vincyvincent/ymbd/supabase/audit/14_audited_routines.sql)**: Checks the signature and presence of key audited search functions.
15. **[15_vector_objects.sql](file:///Users/vincyvincent/ymbd/supabase/audit/15_vector_objects.sql)**: Audits all vector-related tables, columns, indexes, and functions.
16. **[16_app_role_mutations.sql](file:///Users/vincyvincent/ymbd/supabase/audit/16_app_role_mutations.sql)**: Specifically audits roles that can update profile roles (evaluating self-promotion).
17. **[17_pii_access.sql](file:///Users/vincyvincent/ymbd/supabase/audit/17_pii_access.sql)**: Inspects direct grants and signatures returning private fields.
18. **[18_effective_sensitive_privileges.sql](file:///Users/vincyvincent/ymbd/supabase/audit/18_effective_sensitive_privileges.sql)**: Resolves effective inherited or explicit permissions on sensitive attributes.
19. **[19_imis_id_presence.sql](file:///Users/vincyvincent/ymbd/supabase/audit/19_imis_id_presence.sql)**: Audits which tables contain the `imis_id` column.
20. **[20_replication_membership.sql](file:///Users/vincyvincent/ymbd/supabase/audit/20_replication_membership.sql)**: Verifies logical replication publications.
21. **[21_views_materialized.sql](file:///Users/vincyvincent/ymbd/supabase/audit/21_views_materialized.sql)**: Audits definitions of public views and materialized views.
22. **[22_migration_history.sql](file:///Users/vincyvincent/ymbd/supabase/audit/22_migration_history.sql)**: Lists migration logs to confirm schema parity.
