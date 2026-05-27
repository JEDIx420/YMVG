"use server";

import { createClient } from "@supabase/supabase-js";
import { getEmbedding } from "@/app/actions/getEmbedding";

export async function syncAllVectors(): Promise<{ success: boolean; message?: string; count?: number }> {
  try {
    // 1. Bypass RLS: Initialize using SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Fetch Target Rows: embedding IS NULL
    const { data: businesses, error: fetchError } = await supabase
      .from('businesses')
      .select('id, brand_name, category, description, services, city, state, country')
      .is('embedding', null);

    if (fetchError || !businesses) {
      console.error("Failed to fetch businesses:", fetchError);
      return { success: false, message: "Failed to fetch businesses." };
    }

    let successCount = 0;

    // 3. Iterate and Embed
    for (const biz of businesses) {
      const payloadString = `Company: ${biz.brand_name || ''} | Location: ${biz.city || ''}, ${biz.state || ''}, ${biz.country || ''} | Category: ${biz.category || ''} | Description: ${biz.description || ''} | Core Expertise: ${biz.services ? biz.services.join(', ') : ''}`;
      
      const embedding = await getEmbedding(payloadString, "passage");

      if (embedding) {
        const { error: updateError } = await supabase
          .from('businesses')
          .update({ embedding })
          .eq('id', biz.id);

        if (updateError) {
          console.error(`Failed to update vector for business ${biz.id}:`, updateError);
        } else {
          successCount++;
        }
      } else {
        console.error(`Failed to generate embedding for business ${biz.id}`);
      }
    }

    return { success: true, count: successCount, message: `Successfully synced ${successCount} business vectors.` };
  } catch (error) {
    console.error("syncAllVectors encountered an error:", error);
    return { success: false, message: "An unexpected error occurred during sync." };
  }
}

export async function syncSingleVector(businessId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: biz, error: fetchError } = await supabase
      .from('businesses')
      .select('id, brand_name, category, description, services, city, state, country')
      .eq('id', businessId)
      .single();

    if (fetchError || !biz) {
      return { success: false, message: "Failed to fetch business." };
    }

    const payloadString = `Company: ${biz.brand_name || ''} | Location: ${biz.city || ''}, ${biz.state || ''}, ${biz.country || ''} | Category: ${biz.category || ''} | Description: ${biz.description || ''} | Core Expertise: ${biz.services ? biz.services.join(', ') : ''}`;

    const embedding = await getEmbedding(payloadString, "passage");

    if (embedding) {
      const { error: updateError } = await supabase
        .from('businesses')
        .update({ embedding })
        .eq('id', biz.id);

      if (updateError) {
        console.error(`Failed to update vector for business ${biz.id}:`, updateError);
        return { success: false, message: "Failed to update embedding in database." };
      }
      return { success: true, message: "Vector synced successfully." };
    } else {
      return { success: false, message: "Failed to generate embedding." };
    }
  } catch (error) {
    console.error("syncSingleVector encountered an error:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}
