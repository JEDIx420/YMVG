"use server";

import { withAuthAction } from "@/utils/supabase/db-helper";

export async function getOrSyncBusiness() {
  return withAuthAction(async (supabase, user) => {
    // Standard Fetch (Uses regular authenticated client)
    const { data: businesses, error: fetchError } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', user.id);

    if (fetchError) {
      console.error("Error fetching businesses:", fetchError);
      return null;
    }

    // Return early if businesses exist
    if (businesses && businesses.length > 0) {
      return { businesses };
    }

    return null;
  }, null);
}
