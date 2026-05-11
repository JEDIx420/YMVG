"use server";

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { withAuthAction } from "@/utils/supabase/db-helper";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getOrSyncBusiness() {
  return withAuthAction(async (supabase, user) => {
    // STEP 1: Standard Fetch (Uses regular authenticated client)
    const { data: businesses, error: fetchError } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', user.id);

    if (fetchError) throw fetchError;

    // STEP 2: Return early if businesses exist
    if (businesses && businesses.length > 0) {
      return { businesses };
    }

    // STEP 3: Auto-Claim Fallback (MUST USE ADMIN CLIENT)
    if (user.email) {
      console.log("No businesses found for UID. Attempting Admin Auto-Claim for:", user.email);
      
      const { data: orphanedBusinesses, error: orphanError } = await supabaseAdmin
        .from('businesses')
        .select('id')
        .eq('owner_email', user.email)
        .is('owner_id', null);

      if (orphanError) {
        console.error("Admin orphan fetch failed:", orphanError);
        return { businesses: [] };
      }

      if (orphanedBusinesses && orphanedBusinesses.length > 0) {
        // Claim them using Admin Client to bypass RLS
        const { error: updateError } = await supabaseAdmin
          .from('businesses')
          .update({ owner_id: user.id })
          .eq('owner_email', user.email)
          .is('owner_id', null);

        if (updateError) {
          console.error("Admin claim update failed:", updateError);
          return { businesses: [] };
        }

        console.log("Successfully claimed orphaned businesses.");

        // STEP 4: Re-fetch with standard client now that ownership is established
        const { data: updatedBusinesses } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', user.id);
          
        return { businesses: updatedBusinesses || [] };
      }
    }
    return { businesses: [] }; // Pure empty state
  }, { businesses: [] });
}
