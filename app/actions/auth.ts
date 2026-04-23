"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function verifyImisId(imisId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("businesses")
      .select("id")
      .eq("imis_id", imisId)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: "Invalid IMIS ID or ID not found." };
    }

    // Set HTTP-only cookie, valid for 15 minutes
    const cookieStore = await cookies();
    cookieStore.set("imis_id", imisId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });

    return { success: true };
  } catch (err) {
    console.error("verifyImisId error:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}
