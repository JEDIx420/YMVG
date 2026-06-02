import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/profiles";
import { createClient } from "@/utils/supabase/server";
import MemberView from "./components/MemberView";
import BusinessOwnerView from "./components/BusinessOwnerView";
import AdminView from "./components/AdminView";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
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

  // Check URL parameters for view toggle
  const resolvedSearchParams = await searchParams;
  const view = resolvedSearchParams.view;

  if (profile.app_role === "super_admin" && view === "owner") {
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

  // 3. Dynamic database query dispatch based on user role parameters
  switch (profile.app_role) {
    case "super_admin":
    case "region_admin": {
      const [
        membersRes,
        businessesRes,
        campaignsRes,
        recentCampaignsRes,
        recentProfilesRes,
        recentBusinessesRes,
        allBusinessesRes,
        allCampaignsRes
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("businesses").select("*", { count: "exact", head: true }),
        supabase.from("ad_campaigns").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("ad_campaigns").select("id, status, boost_multiplier, created_at, businesses(brand_name)").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("id, full_name, email, app_role, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("businesses").select("id, brand_name, category, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("businesses").select("category"),
        supabase.from("ad_campaigns").select("status")
      ]);

      const activities: any[] = [];

      // 1. Process recent profiles
      if (recentProfilesRes.data) {
        recentProfilesRes.data.forEach((p: any) => {
          activities.push({
            type: "auth",
            desc: `New member registered: ${p.full_name || p.email}`,
            time: p.created_at,
            status: "success"
          });
        });
      }

      // 2. Process recent businesses
      if (recentBusinessesRes.data) {
        recentBusinessesRes.data.forEach((b: any) => {
          activities.push({
            type: "business",
            desc: `New business listing: '${b.brand_name || 'Unnamed'}' under ${b.category || 'Professional'}`,
            time: b.created_at,
            status: "success"
          });
        });
      }

      // 3. Process recent campaigns
      if (recentCampaignsRes.data) {
        recentCampaignsRes.data.forEach((c: any) => {
          const bizName = (c.businesses as any)?.brand_name || "Unnamed Listing";
          activities.push({
            type: "ad",
            desc: `Campaign boost requested (${c.boost_multiplier}x) for '${bizName}'`,
            time: c.created_at,
            status: c.status
          });
        });
      }

      // Sort combined array by time descending
      const sortedActivities = activities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 5)
        .map((act) => {
          // Format relative time
          const diffMs = Date.now() - new Date(act.time).getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHrs = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHrs / 24);

          let timeStr = "Just now";
          if (diffDays > 0) {
            timeStr = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
          } else if (diffHrs > 0) {
            timeStr = `${diffHrs} hr${diffHrs > 1 ? "s" : ""} ago`;
          } else if (diffMins > 0) {
            timeStr = `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
          }

          return {
            type: act.type,
            desc: act.desc,
            time: timeStr,
            status: act.status
          };
        });

      // Aggregate Category Stats
      const catCounts: { [key: string]: number } = {};
      if (allBusinessesRes.data) {
        allBusinessesRes.data.forEach((b: any) => {
          const cat = b.category || "Other";
          catCounts[cat] = (catCounts[cat] || 0) + 1;
        });
      }
      const categoryStats = Object.entries(catCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Aggregate Campaign Status Stats
      const statusCounts: { [key: string]: number } = {};
      if (allCampaignsRes.data) {
        allCampaignsRes.data.forEach((c: any) => {
          const status = c.status || "draft";
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
      }
      const campaignStats = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }));

      return (
        <AdminView
          profile={profile}
          memberCount={membersRes.count || 0}
          businessCount={businessesRes.count || 0}
          activeCampaignsCount={campaignsRes.count || 0}
          recentActivities={sortedActivities}
          categoryStats={categoryStats}
          campaignStats={campaignStats}
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
