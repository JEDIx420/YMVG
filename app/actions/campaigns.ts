"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Fetches all active homepage_patron campaigns with their associated business brand_name, logo_url, and website_url.
 */
export async function getActivePatrons() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ad_campaigns")
      .select(`
        id,
        status,
        start_date,
        end_date,
        campaign_type,
        businesses (
          id,
          brand_name,
          logo_url,
          website_url
        )
      `, { count: 'exact', head: false })
      .eq("campaign_type", "homepage_patron")
      .eq("status", "active");

    if (error) {
      console.error("Error fetching active patrons:", error);
      return { success: false, error: error.message };
    }

    // Filter campaigns that are currently active based on system date
    const now = new Date();
    const activePatrons = (data || [])
      .filter((c: any) => {
        const start = new Date(c.start_date);
        const end = new Date(c.end_date);
        return now >= start && now <= end && c.businesses;
      })
      .map((c: any) => ({
        campaignId: c.id,
        businessId: c.businesses.id,
        brandName: c.businesses.brand_name,
        logoUrl: c.businesses.logo_url,
        websiteUrl: c.businesses.website_url,
      }));

    return { success: true, data: activePatrons };
  } catch (err: any) {
    console.error("getActivePatrons exception:", err);
    return { success: false, error: err.message || "An unexpected error occurred" };
  }
}
