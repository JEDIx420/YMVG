"use server";

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { withAuthAction } from "@/utils/supabase/db-helper";
import { revalidatePath } from "next/cache";

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
        console.log(`Found ${orphanedBusinesses.length} orphaned business(es) for ${user.email}. Fetching profile...`);

        // 1. Fetch user's profile to get profile.id and current app_role
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id, app_role')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile) {
          console.error("Failed to retrieve user profile for claiming:", profileError);
          return { businesses: [] };
        }

        // 2. Link the Auth ID & Profile ID in businesses table
        const { error: updateError } = await supabaseAdmin
          .from('businesses')
          .update({ 
            owner_id: user.id,
            owner_profile_id: profile.id
          })
          .eq('owner_email', user.email)
          .is('owner_id', null);

        if (updateError) {
          console.error("Admin claim update failed:", updateError);
          return { businesses: [] };
        }

        // 3. Upgrade Authorization Tier (Only upgrade if they are currently a 'member')
        if (profile.app_role === 'member') {
          console.log(`Upgrading authorization tier for user ${user.id} from member to business_owner`);
          const { error: roleUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({ app_role: 'business_owner' })
            .eq('id', profile.id);

          if (roleUpdateError) {
            console.error("Failed to upgrade profile app_role to business_owner:", roleUpdateError);
          }
        }

        // 4. Invalidate cache to trigger layout redirects
        console.log("Invalidating dashboard cache paths...");
        revalidatePath('/dashboard');

        console.log("Successfully claimed orphaned businesses.");

        // STEP 4: Refetch with standard client now that ownership is established
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
