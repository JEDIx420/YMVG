"use server";

import { revalidatePath } from "next/cache";
import { generateBusinessVector } from "@/utils/ai/vector-generator";
import { withAuthAction } from "@/utils/supabase/db-helper";

export async function updateBusiness(businessId: string, formData: any) {
  return withAuthAction(async (supabase, user) => {

  // 2. Security Check: Verify Ownership
  const { data: existing, error: fetchError } = await supabase
    .from("businesses")
    .select("owner_id")
    .eq("id", businessId)
    .single();

  if (fetchError || !existing) {
    return { error: "Business profile not found." };
  }

  if (existing.owner_id !== user.id) {
    return { error: "Security Violation: You do not have permission to edit this profile." };
  }

  // 3. Perform Update
  const { error: updateError } = await supabase
    .from("businesses")
    .update({
      brand_name: formData.brand_name,
      tagline: formData.tagline,
      description: formData.description,
      category: formData.category,
      services: formData.services,
      special_offer: formData.special_offer,
      website_url: formData.website_url,
      contact_phone: formData.contact_phone,
      contact_email: formData.contact_email,
      address: formData.address,
      ym_region: formData.ym_region,
      ym_district: formData.ym_district,
      ym_zone: formData.ym_zone,
      ym_club: formData.ym_club,
      logo_url: formData.logo_url,
      brochure_url: formData.brochure_url,
      primary_image_url: formData.primary_image_url,
    })
    .eq("id", businessId);

  if (updateError) {
    console.error("Update error:", updateError);
    return { error: "Failed to update business profile. Please try again." };
  }

  // 4. Generate and save AI Vector Embedding
  try {
    const vector = await generateBusinessVector(formData);
    if (vector) {
      const { error: vectorError } = await supabase
        .from("businesses")
        .update({ embedding: vector })
        .eq("id", businessId);
      
      if (vectorError) {
        console.error("Failed to update vector embedding:", vectorError);
      }
    }
  } catch (vectorError) {
    console.error("Error during vector generation:", vectorError);
  }

    // 4. Invalidate cache for directory and spotlight pages
    revalidatePath("/directory");
    revalidatePath(`/directory/${businessId}`);
    revalidatePath("/dashboard");

    return { success: true };
  }, { error: "Authentication failed or unexpected error occurred." });
}
