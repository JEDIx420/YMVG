"use server";

import { createClient } from "@/utils/supabase/server";

export async function getOrSyncBusiness() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Step 1: Try to fetch by the proper owner_id
  let { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  // Step 2: Auto-Claim Fallback
  if (!business && user.email) {
    // Look for an orphaned business matching their verified email
    const { data: orphanedBusiness } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_email', user.email)
      .is('owner_id', null)
      .single();

    if (orphanedBusiness) {
      // Claim it: Update the database to link this UUID
      const { data: updatedBusiness, error: updateError } = await supabase
        .from('businesses')
        .update({ owner_id: user.id })
        .eq('id', orphanedBusiness.id)
        .select()
        .single();
        
      if (!updateError) {
        business = updatedBusiness;
      }
    }
  }

  return { business: business || null };
}
