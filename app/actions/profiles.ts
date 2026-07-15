"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withAuthAction } from "@/utils/supabase/db-helper";

// Define strict validation schema for profile onboarding/editing
const profileUpdateSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters."),
  phone: z.string().min(5, "Please enter a valid phone number."),
}).strict();

export type Profile = {
  id: string;
  user_id: string | null;
  club_id?: string | null;
  full_name: string | null;
  email: string;
  phone: string | null;
  club: string | null;
  app_role: 'super_admin' | 'review_admin' | 'business_owner' | 'member';
  created_at: string;
  imis_id?: string | null;
  ym_region?: string | null;
  ym_district?: string | null;
  ym_zone?: string | null;
  ym_club?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  education?: string | null;
  job_title?: string | null;
  account_approved_at?: string | null;
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
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("Database error updating profile:", error);
        return { success: false, error: "Failed to update profile in database." };
      }

      revalidatePath("/dashboard");
      return { success: true };
    } catch (err) {
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
  return withAuthAction(async (supabase) => {
    const { error } = await supabase.rpc("promote_to_business_owner");
    if (error) {
      console.error("Error promoting user to business_owner:", error);
      return { success: false, error: "Failed to elevate user permissions." };
    }

    revalidatePath("/dashboard");
    return { success: true };
  }, { success: false, error: "Authentication failed." });
}

const personalProfileUpdateSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters."),
  phone: z.string().min(5, "Please enter a valid phone number."),
  imis_id: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  education: z.string().nullable().optional(),
  job_title: z.string().nullable().optional(),
}).strict();

/**
 * Updates the user's personal profile details.
 */
export async function updatePersonalProfile(formData: FormData): Promise<{ success: boolean; error?: string }> {
  return withAuthAction(async (supabase, user) => {
    try {
      // 1. Extract values
      const rawFullName = formData.get("full_name");
      const rawPhone = formData.get("phone");
      const rawImisId = formData.get("imis_id");
      const rawAddress = formData.get("address");
      const rawCity = formData.get("city");
      const rawState = formData.get("state");
      const rawCountry = formData.get("country");
      const rawEducation = formData.get("education");
      const rawJobTitle = formData.get("job_title");

      // 2. Sanitize values
      const sanitizeString = (val: unknown) => {
        if (typeof val !== "string") return null;
        const trimmed = val.trim();
        return trimmed === "" ? null : trimmed;
      };

      const full_name = typeof rawFullName === "string" ? rawFullName.trim() : "";
      const phone = typeof rawPhone === "string" ? rawPhone.trim() : "";
      const imis_id = sanitizeString(rawImisId);
      const address = sanitizeString(rawAddress);
      const city = sanitizeString(rawCity);
      const state = sanitizeString(rawState);
      const country = sanitizeString(rawCountry);
      const education = sanitizeString(rawEducation);
      const job_title = sanitizeString(rawJobTitle);

      // 3. Validate inputs server-side
      const validated = personalProfileUpdateSchema.parse({
        full_name,
        phone,
        imis_id,
        address,
        city,
        state,
        country,
        education,
        job_title,
      });

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: validated.full_name,
          phone: validated.phone,
          imis_id: validated.imis_id || null,
          address: validated.address || null,
          city: validated.city || null,
          state: validated.state || null,
          country: validated.country || null,
          education: validated.education || null,
          job_title: validated.job_title || null,
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("Database error updating personal profile:", error);
        if (error.message && error.message.includes("IMIS_LIMIT_REACHED")) {
          return { success: false, error: "This IMIS ID has reached its maximum account linking limit." };
        }
        return { success: false, error: "Failed to update personal profile in database." };
      }

      revalidatePath("/dashboard/profile");
      revalidatePath("/dashboard");
      return { success: true };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return { success: false, error: err.issues[0].message };
      }
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      return { success: false, error: errMsg };
    }
  }, { success: false, error: "Authentication failed. Please log in again." });
}

const assignRoleSchema = z.object({
  targetProfileId: z.string().uuid("Invalid target profile ID."),
  newRole: z.enum(["member", "business_owner", "review_admin", "super_admin"]),
}).strict();

export async function assignUserRole(rawPayload: unknown): Promise<{ success: boolean; error?: string }> {
  return withAuthAction(async (supabase) => {
    try {
      const validated = assignRoleSchema.parse(rawPayload);

      // Invoke database RPC assign_user_role (verifies super_admin server-side)
      const { error } = await supabase.rpc("assign_user_role", {
        target_profile_id: validated.targetProfileId,
        requested_role: validated.newRole
      });

      if (error) {
        console.error("Error setting user role via RPC:", error);
        return { success: false, error: error.message };
      }

      revalidatePath("/dashboard/users");
      return { success: true };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return { success: false, error: err.issues[0].message };
      }
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      return { success: false, error: errMsg };
    }
  }, { success: false, error: "Authentication failed." });
}
