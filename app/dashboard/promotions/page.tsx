import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/profiles";
import { createClient } from "@/utils/supabase/server";
import PromotionsClient from "./PromotionsClient";

export const metadata = {
  title: "Sponsorship Promotions - Business Directory Dashboard",
  description: "Boost your business search visibility inside the Y's Men SWIR directory.",
};

export default async function PromotionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  // Security gate: ONLY business_owners or reviewer admins can access promotions
  const isBusinessOwner = profile.app_role === "business_owner";
  const isAdmin = profile.app_role === "super_admin" || profile.app_role === "review_admin";

  if (!isBusinessOwner && !isAdmin) {
    redirect("/dashboard");
  }

  // 1. Fetch user's business listings
  // If admin, fetch all businesses so they can test/create campaigns.
  // Otherwise, only fetch businesses owned by the authenticated owner.
  let businessesQuery = supabase.from("businesses").select("id, brand_name, category, logo_url, city, website_url");
  if (!isAdmin) {
    businessesQuery = businessesQuery.eq("owner_id", user.id);
  }
  const { data: businesses } = await businessesQuery;

  // 2. Fetch campaign details for these businesses
  let campaigns: any[] = [];
  if (businesses && businesses.length > 0) {
    const bizIds = businesses.map((b) => b.id);
    const { data: campaignData } = await supabase
      .from("ad_campaigns")
      .select("*, businesses(brand_name, category, logo_url)")
      .in("business_id", bizIds)
      .order("created_at", { ascending: false });

    if (campaignData) {
      campaigns = campaignData;
    }
  }

  return (
    <PromotionsClient
      profile={profile}
      businesses={businesses || []}
      initialCampaigns={campaigns}
    />
  );
}
