"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getEmbedding } from "@/app/actions/getEmbedding";

export async function syncAllVectors(): Promise<{ success: boolean; message?: string; count?: number }> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Fetch all rows
    const { data: businesses, error: fetchError } = await supabase
      .from('businesses')
      .select('id, brand_name, category, description, services');

    if (fetchError || !businesses) {
      console.error("Failed to fetch businesses:", fetchError);
      return { success: false, message: "Failed to fetch businesses." };
    }

    let successCount = 0;

    for (const business of businesses) {
      // Synthesize text
      const richText = `${business.brand_name || ''} in ${business.category || 'General'}. ${business.description || ''}. Services: ${(business.services || []).join(', ')}`;
      
      // Fetch new embedding as 'passage'
      const embedding = await getEmbedding(richText, "passage");

      if (embedding) {
        const { error: updateError } = await supabase
          .from('businesses')
          .update({ embedding })
          .eq('id', business.id);

        if (updateError) {
          console.error(`Failed to update vector for business ${business.id}:`, updateError);
        } else {
          successCount++;
        }
      } else {
        console.error(`Failed to generate embedding for business ${business.id}`);
      }
    }

    return { success: true, count: successCount, message: `Successfully updated ${successCount} vectors.` };
  } catch (error) {
    console.error("syncAllVectors encountered an error:", error);
    return { success: false, message: "An unexpected error occurred during sync." };
  }
}
