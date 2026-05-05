"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getEmbedding } from "./getEmbedding";
import { Business } from "@/types/database.types";
import { generateBusinessVector } from "@/utils/ai/vector-generator";

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
    // 1. Insert into Database WITHOUT Embedding
    const { data, error } = await supabase
      .from('businesses')
      .insert([payload])
      .select('id')
      .single();

    if (error) {
      console.error("Database Insert Error:", error);
      return { success: false, error: error.message };
    }

    const newBusinessId = data.id;

    // 2. Generate and save AI Vector Embedding
    console.log("Vectorizing new business entry...");
    try {
      const vector = await generateBusinessVector(payload);
      if (vector) {
        const { error: vectorError } = await supabase
          .from('businesses')
          .update({ embedding: vector })
          .eq('id', newBusinessId);
        
        if (vectorError) {
          console.error("Failed to save vector embedding:", vectorError);
        }
      } else {
        console.warn("AI Vectorization returned null, business created without embedding.");
      }
    } catch (vectorError) {
      console.error("Error generating/saving embedding:", vectorError);
    }

    return { success: true, id: newBusinessId };
  } catch (err) {
    console.error("addBusiness pipeline failed:", err);
    return { success: false, error: "An unexpected error occurred during the business submission." };
  }
}
