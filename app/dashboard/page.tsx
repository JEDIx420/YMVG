import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/profiles";
import { createClient } from "@/utils/supabase/server";
import MemberView from "./components/MemberView";
import BusinessOwnerView from "./components/BusinessOwnerView";
import AdminView from "./components/AdminView";

export default async function DashboardPage() {
  // 1. Fetch authenticated session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // 2. Fetch normalized profile details
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/");
  }

  // 3. Dynamic database query dispatch based on user role parameters
  switch (profile.app_role) {
    case "super_admin":
    case "region_admin": {
      // Admin dashboard data aggregations
      const [membersRes, businessesRes, campaignsRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("businesses").select("*", { count: "exact", head: true }),
        supabase.from("ad_campaigns").select("*", { count: "exact", head: true }).eq("status", "active"),
      ]);

      return (
        <AdminView
          profile={profile}
          memberCount={membersRes.count || 0}
          businessCount={businessesRes.count || 0}
          activeCampaignsCount={campaignsRes.count || 0}
        />
      );
    }

    case "business_owner": {
      // Business owner listing portfolio & traffic analytics aggregations
      const { data: businesses } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id);

      let analyticsEvents: any[] = [];
      
      if (businesses && businesses.length > 0) {
        const bizIds = businesses.map(b => b.id);
        const { data: events } = await supabase
          .from("analytics_events")
          .select("business_id, event_type")
          .in("business_id", bizIds);

        if (events) {
          analyticsEvents = events;
        }
      }

      return (
        <BusinessOwnerView
          profile={profile}
          businesses={businesses || []}
          analyticsEvents={analyticsEvents}
        />
      );
    }

    case "member":
    default: {
      // Member specific referral scoring scoreboard aggregation
      const { count: referralCount } = await supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("referrer_profile_id", profile.id);

      return (
        <MemberView
          profile={profile}
          referralCount={referralCount || 0}
        />
      );
    }
  }
}
