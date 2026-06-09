"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Business } from "@/types/database.types";

export async function addBusiness(
  payload: Omit<Business, 'id'>
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
    // 1. Insert into Database
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

    return { success: true, id: newBusinessId };
  } catch (err) {
    console.error("addBusiness pipeline failed:", err);
    return { success: false, error: "An unexpected error occurred during the business submission." };
  }
}
