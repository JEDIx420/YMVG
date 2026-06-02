"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withAuthAction } from "@/utils/supabase/db-helper";

// Define strict validation schema for profile onboarding/editing
const profileUpdateSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters."),
  phone: z.string().min(5, "Please enter a valid phone number."),
  club: z.string().min(2, "Please select or enter your Y's Men Club affiliation."),
});

export type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  club: string | null;
  app_role: 'super_admin' | 'region_admin' | 'business_owner' | 'member';
  created_at: string;
};

/**
 * Retrieves the current logged-in user's profile from the public.profiles table.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  return withAuthAction(async (supabase, user) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    return data as Profile;
  }, null);
}

/**
 * Updates the user's basic profile details (onboarding form or editing dashboard).
 */
export async function updateProfile(formData: {
  full_name: string;
  phone: string;
  club: string;
}): Promise<{ success: boolean; error?: string }> {
  return withAuthAction(async (supabase, user) => {
    try {
      // Validate inputs server-side
      const validated = profileUpdateSchema.parse(formData);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: validated.full_name,
          phone: validated.phone,
          club: validated.club,
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("Database error updating profile:", error);
        return { success: false, error: "Failed to update profile in database." };
      }

      revalidatePath("/dashboard");
      return { success: true };
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return { success: false, error: err.issues[0].message };
      }
      return { success: false, error: "An unexpected error occurred." };
    }
  }, { success: false, error: "Authentication failed. Please log in again." });
}

/**
 * Upgrades a standard 'member' role to 'business_owner' upon successful creation/claiming of a business.
 */
export async function upgradeProfileToBusinessOwner(): Promise<{ success: boolean; error?: string }> {
  return withAuthAction(async (supabase, user) => {
    // 1. Fetch current role to make sure we don't downgrade super_admin or region_admin
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("app_role")
      .eq("user_id", user.id)
      .single();

    if (fetchError || !profile) {
      return { success: false, error: "Profile not found." };
    }

    // Protect administrative roles from accidental modifications
    if (profile.app_role === "super_admin" || profile.app_role === "region_admin") {
      return { success: true }; // Keep higher permissions intact
    }

    // 2. Perform role escalation
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ app_role: "business_owner" })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error upgrading user to business_owner:", updateError);
      return { success: false, error: "Failed to elevate user permissions." };
    }

    revalidatePath("/dashboard");
    return { success: true };
  }, { success: false, error: "Authentication failed." });
}
