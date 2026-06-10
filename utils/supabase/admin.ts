import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client using the service_role key.
 * This client bypasses all Row-Level Security (RLS) policies.
 * ONLY use this client in secure server-side environments (Server Actions / Route Handlers)
 * and after performing proper authentication/authorization checks.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables.");
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
