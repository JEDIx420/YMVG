"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getOrSyncBusiness() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
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

  } catch (error: any) {
    // Safety check: Do not swallow Next.js internal signals
    if (
      error instanceof Error && 
      (error.message === 'NEXT_REDIRECT' || error.message.includes('DynamicServerError'))
    ) {
      throw error;
    }
    
    // Also check Next 15 specific digest for dynamic server usage
    if (error?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }

    // Better logging for opaque errors
    console.error(
      "CRITICAL ERROR in getOrSyncBusiness:", 
      error instanceof Error ? error.message : JSON.stringify(error)
    );
    return { businesses: [] };
  }
}
