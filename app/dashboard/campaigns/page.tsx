import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/profiles";
import { createClient } from "@/utils/supabase/server";
import CampaignsAdminClient from "./CampaignsAdminClient";

export const metadata = {
  title: "Ad Campaigns Panel - Business Directory Dashboard",
  description: "Review, approve, and audit search visibility boost campaigns.",
};

export default async function CampaignsAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  // Security gate: ONLY super_admin or region_admin can access the approval queue
  const isAdmin = profile.app_role === "super_admin" || profile.app_role === "region_admin";
  if (!isAdmin) {
    redirect("/dashboard");
  }

  // 1. Fetch all ad campaigns from database with business and profile relationships
  // We fetch businesses and we fetch the owner profiles
  const { data: campaigns } = await supabase
    .from("ad_campaigns")
    .select(`
      *,
      businesses (
        id,
        brand_name,
        category,
        logo_url,
        ym_region,
        city,
        owner_id,
        owner_name,
        contact_email,
        contact_phone
      )
    `)
    .order("created_at", { ascending: false });

  // 2. Query all profiles to easily resolve owner names if needed (though contact details are in business table)
  // To keep payload light, we can resolve directly in client using the contact details or fetch profiles
  let profiles: any[] = [];
  if (campaigns && campaigns.length > 0) {
    const ownerIds = Array.from(new Set(campaigns.map((c) => c.businesses?.owner_id).filter(Boolean)));
    if (ownerIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, club")
        .in("user_id", ownerIds);
      if (profileData) {
        profiles = profileData;
      }
    }
  }

  return (
    <CampaignsAdminClient
      profile={profile}
      initialCampaigns={campaigns || []}
      ownerProfiles={profiles}
    />
  );
}
