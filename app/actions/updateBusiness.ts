"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateBusiness(businessId: string, formData: any) {
  const supabase = await createClient();

  // 1. Verify User Session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to update your business profile." };
  }

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
      logo_url: formData.logo_url,
      primary_image_url: formData.primary_image_url,
    })
    .eq("id", businessId);

  if (updateError) {
    console.error("Update error:", updateError);
    return { error: "Failed to update business profile. Please try again." };
  }

  // 4. Invalidate cache for directory and spotlight pages
  revalidatePath("/directory");
  revalidatePath(`/directory/${businessId}`);
  revalidatePath("/dashboard");

  return { success: true };
}
