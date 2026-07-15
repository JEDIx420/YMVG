"use server";

import { withAuthAction } from "@/utils/supabase/db-helper";
import { revalidatePath } from "next/cache";

export async function deleteBusiness(businessId: string): Promise<{ success: boolean; error?: string }> {
  return withAuthAction(async (supabase, user) => {
    try {
      // 1. Fetch current user's profile to strictly validate super_admin role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("app_role")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        return { success: false, error: "Failed to verify administrator profile." };
      }

      if (profile.app_role !== "super_admin") {
        return { success: false, error: "Unauthorized. Super Admin permissions are required to delete directory listings." };
      }

      // 2. Execute deletion of the business listing
      const { error: deleteError } = await supabase
        .from("businesses")
        .delete()
        .eq("id", businessId);

      if (deleteError) {
        console.error("Error deleting business listing:", deleteError);
        return { success: false, error: deleteError.message || "Failed to delete business listing from the database." };
      }

      // 3. Revalidate paths to update directory and dashboard listings instantly
      revalidatePath("/dashboard/businesses");
      revalidatePath("/directory");
      revalidatePath("/");

      return { success: true };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      return { success: false, error: errMsg };
    }
  }, { success: false, error: "Authentication failed. Please log in again." });
}
