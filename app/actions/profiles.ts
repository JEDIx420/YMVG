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
  user_id: string | null;
  full_name: string | null;
  email: string;
  phone: string | null;
  club: string | null;
  app_role: 'super_admin' | 'region_admin' | 'business_owner' | 'member';
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

const personalProfileUpdateSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters."),
  phone: z.string().min(5, "Please enter a valid phone number."),
  imis_id: z.string().nullable().optional(),
  ym_region: z.string().nullable().optional(),
  ym_district: z.string().nullable().optional(),
  ym_zone: z.string().nullable().optional(),
  ym_club: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  education: z.string().nullable().optional(),
  job_title: z.string().nullable().optional(),
});

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
      const rawYmRegion = formData.get("ym_region");
      const rawYmDistrict = formData.get("ym_district");
      const rawYmZone = formData.get("ym_zone");
      const rawYmClub = formData.get("ym_club");
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
      const ym_region = sanitizeString(rawYmRegion);
      const ym_district = sanitizeString(rawYmDistrict);
      const ym_zone = sanitizeString(rawYmZone);
      const ym_club = sanitizeString(rawYmClub);
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
        ym_region,
        ym_district,
        ym_zone,
        ym_club,
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
          ym_region: validated.ym_region || null,
          region: validated.ym_region || null, // Sync both columns
          ym_district: validated.ym_district || null,
          ym_zone: validated.ym_zone || null,
          ym_club: validated.ym_club || null,
          club: validated.ym_club || null, // Sync both columns
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
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return { success: false, error: err.issues[0].message };
      }
      return { success: false, error: err.message || "An unexpected error occurred." };
    }
  }, { success: false, error: "Authentication failed. Please log in again." });
}

