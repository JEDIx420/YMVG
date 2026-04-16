"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getEmbedding } from "./getEmbedding";
import { Business } from "@/types/database.types";

export async function addBusiness(
  payload: Omit<Business, 'id' | 'embedding'>
): Promise<{ success: boolean; id?: string; error?: string }> {
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

  try {
    // 1. Synthesize text for vectorization
    const richText = `${payload.brand_name || ''} in ${payload.category || 'General'}. ${payload.description || ''}. Services: ${(payload.services || []).join(', ')}`;

    // 2. Generate AI Vector Embedding
    console.log("Vectorizing new business entry...");
    const embedding = await getEmbedding(richText);

    if (!embedding) {
      return { 
        success: false, 
        error: "AI Vectorization failed. Please check your AI API key and networking." 
      };
    }

    // 3. Insert into Database with Embedding
    const { data, error } = await supabase
      .from('businesses')
      .insert([
        {
          ...payload,
          embedding
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error("Database Insert Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (err) {
    console.error("addBusiness pipeline failed:", err);
    return { success: false, error: "An unexpected error occurred during the business submission." };
  }
}
