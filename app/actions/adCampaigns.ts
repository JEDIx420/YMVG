"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withAuthAction } from "@/utils/supabase/db-helper";
import { getCurrentProfile } from "./profiles";

const campaignSchema = z.object({
  businessId: z.string().uuid("Invalid Business ID format."),
  campaignType: z.enum(["search_boost", "homepage_patron"]),
  boostMultiplier: z.number().min(1.0, "Boost multiplier must be at least 1.0x.").max(3.0, "Boost multiplier limit is 3.0x."),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), "Invalid start date."),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), "Invalid end date."),
  paymentProofUrl: z.string().optional().nullable(),
}).refine(data => {
  if (data.campaignType === "search_boost" && data.boostMultiplier < 1.1) {
    return false;
  }
  if (data.campaignType === "homepage_patron" && !data.paymentProofUrl) {
    return false;
  }
  return true;
}, {
  message: "Homepage Patron requests must provide a payment proof screenshot.",
  path: ["paymentProofUrl"]
});

/**
 * Creates a new pending advertising boost or homepage patron campaign for a business listing.
 * Restricts creation to the verified business owner.
 */
export async function createAdCampaign(formData: {
  businessId: string;
  campaignType: "search_boost" | "homepage_patron";
  boostMultiplier: number;
  startDate: string;
  endDate: string;
  paymentProofUrl?: string | null;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  return withAuthAction(async (supabase, user) => {
    try {
      // 1. Validate form fields
      const validated = campaignSchema.parse(formData);

      // 2. Validate ownership of the business listing
      const { data: business, error: fetchError } = await supabase
        .from("businesses")
        .select("owner_id")
        .eq("id", validated.businessId)
        .single();

      if (fetchError || !business) {
        return { success: false, error: "Target business listing not found." };
      }

      if (business.owner_id !== user.id) {
        return { success: false, error: "Security Violation: You do not own this business listing." };
      }

      // 3. Insert the new campaign in 'pending' review state
      const { data: campaign, error: insertError } = await supabase
        .from("ad_campaigns")
        .insert({
          business_id: validated.businessId,
          campaign_type: validated.campaignType,
          status: "pending",
          boost_multiplier: validated.campaignType === "search_boost" ? validated.boostMultiplier : 1.0,
          start_date: new Date(validated.startDate).toISOString(),
          end_date: new Date(validated.endDate).toISOString(),
          payment_proof_url: validated.paymentProofUrl || null,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Database insert campaign error:", insertError);
        return { success: false, error: "Failed to create campaign in database." };
      }

      revalidatePath("/dashboard");
      return { success: true, id: campaign.id };
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return { success: false, error: err.issues[0].message };
      }
      return { success: false, error: "An unexpected error occurred during submission." };
    }
  }, { success: false, error: "Authentication failed. Please sign in again." });
}

/**
 * Approves a pending advertising boost campaign.
 * Restricts operational access to super_admin and region_admin tiers.
 */
export async function approveCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
  return withAuthAction(async (supabase, user) => {
    try {
      // 1. Verify administrative credentials
      const profile = await getCurrentProfile();
      if (!profile || (profile.app_role !== "super_admin" && profile.app_role !== "region_admin")) {
        return { success: false, error: "Security Violation: Administrative access required." };
      }

      // 2. Escalate campaign status to 'active'
      const { error: updateError } = await supabase
        .from("ad_campaigns")
        .update({ status: "active" })
        .eq("id", campaignId);

      if (updateError) {
        console.error("Error activating campaign:", updateError);
        return { success: false, error: "Failed to activate campaign." };
      }

      // 3. Refresh directory page caching instantly to launch boosts
      revalidatePath("/directory");
      revalidatePath("/dashboard");
      
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "An unexpected error occurred." };
    }
  }, { success: false, error: "Authentication failed." });
}

/**
 * Pauses or declines a campaign (e.g. reject a pending draft or pause active promos).
 */
export async function pauseCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
  return withAuthAction(async (supabase, user) => {
    try {
      const profile = await getCurrentProfile();
      if (!profile) return { success: false, error: "Profile not found." };

      const isAdmin = profile.app_role === "super_admin" || profile.app_role === "region_admin";

      if (isAdmin) {
        // Admins can pause any campaign
        const { error } = await supabase
          .from("ad_campaigns")
          .update({ status: "paused" })
          .eq("id", campaignId);

        if (error) throw error;
      } else {
        // Owners can only pause their own business campaigns
        const { data: campaign, error: fetchError } = await supabase
          .from("ad_campaigns")
          .select("business_id")
          .eq("id", campaignId)
          .single();

        if (fetchError || !campaign) return { success: false, error: "Campaign not found." };

        const { data: business } = await supabase
          .from("businesses")
          .select("owner_id")
          .eq("id", campaign.business_id)
          .single();

        if (!business || business.owner_id !== user.id) {
          return { success: false, error: "Security Violation: Access denied." };
        }

        const { error } = await supabase
          .from("ad_campaigns")
          .update({ status: "paused" })
          .eq("id", campaignId);

        if (error) throw error;
      }

      revalidatePath("/directory");
      revalidatePath("/dashboard");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: "Failed to pause campaign." };
    }
  }, { success: false, error: "Authentication failed." });
}

/**
 * Deletes an advertising campaign from the database.
 * Restricts operational access strictly to super_admin.
 */
export async function deleteCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
  return withAuthAction(async (supabase, user) => {
    try {
      const profile = await getCurrentProfile();
      if (!profile || profile.app_role !== "super_admin") {
        return { success: false, error: "Security Violation: Super Admin administrative access required." };
      }

      const { error } = await supabase
        .from("ad_campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;

      revalidatePath("/directory");
      revalidatePath("/dashboard");
      return { success: true };
    } catch (err: any) {
      console.error("deleteCampaign error:", err);
      return { success: false, error: err.message || "Failed to delete campaign." };
    }
  }, { success: false, error: "Authentication failed." });
}
