"use server";

import { revalidatePath } from "next/cache";
import { withAuthAction } from "@/utils/supabase/db-helper";
import { z } from "zod";

// Strict validation schema rejecting unknown fields
const businessUpdateSchema = z.object({
  brand_name: z.string().min(2, "Brand name is required").max(100),
  category: z.string().min(2, "Category is required").max(50),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  services: z.array(z.string().max(50)).nullable().optional(),
  special_offer: z.string().max(500).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  contact_phone: z.string().max(30).nullable().optional(),
  contact_email: z.string().email("Invalid email format").or(z.literal("")).nullable().optional(),
  website_url: z.string().url("Invalid website URL format").or(z.literal("")).nullable().optional(),
  logo_url: z.string().url("Invalid logo URL format").or(z.literal("")).nullable().optional(),
  primary_image_url: z.string().url("Invalid primary image URL format").or(z.literal("")).nullable().optional(),
  gallery_urls: z.array(z.string().url("Invalid gallery image URL")).nullable().optional(),
  brochure_url: z.string().url("Invalid brochure URL format").or(z.literal("")).nullable().optional(),
  tagline: z.string().max(150).nullable().optional(),
  ym_designation: z.string().max(100).nullable().optional(),
}).strict();

export async function updateBusiness(businessId: string, rawPayload: unknown) {
  return withAuthAction(async (supabase, user) => {
    try {
      // 1. Validate business ID as UUID
      const validatedId = z.string().uuid("Invalid business ID format.").parse(businessId);

      // 2. Validate payload and reject unknown keys
      const validated = businessUpdateSchema.parse(rawPayload);

      // 3. Fetch the target listing owner details
      const { data: existing, error: fetchError } = await supabase
        .from("businesses")
        .select("owner_id")
        .eq("id", validatedId)
        .single();

      if (fetchError || !existing) {
        return { error: "Business profile not found." };
      }

      // 4. Resolve user profile role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("app_role")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        return { error: "Security check: Profile not found." };
      }

      // 5. Authorization Checks
      // ONLY the owner OR a super_admin can edit the business.
      // review_admin is read-only for others' businesses.
      const isOwner = existing.owner_id === user.id;
      const isSuperAdmin = profile.app_role === "super_admin";

      if (!isOwner && !isSuperAdmin) {
        return { error: "Security Violation: You do not have permission to edit this profile." };
      }

      // 6. Execute Update
      const { error: updateError } = await supabase
        .from("businesses")
        .update(validated)
        .eq("id", validatedId);

      if (updateError) {
        console.error("Update error:", updateError);
        return { error: "Failed to update business profile. Please try again." };
      }

      // 7. Invalidate cache
      revalidatePath("/directory");
      revalidatePath(`/directory/${validatedId}`);
      revalidatePath("/dashboard");

      return { success: true };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return { error: err.issues[0].message };
      }
      return { error: "An unexpected error occurred during the update." };
    }
  }, { error: "Authentication failed or unexpected error occurred." });
}
