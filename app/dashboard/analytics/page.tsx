import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/profiles";
import { createClient } from "@/utils/supabase/server";
import AnalyticsClient from "./AnalyticsClient";

export const metadata = {
  title: "Analytics Dashboard - Business Directory",
  description: "View real-time analytics data across regions, categories, and ad campaigns.",
};

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  // Security gate: ONLY super_admin or region_admin can access directory-wide analytics
  const isAdmin = profile.app_role === "super_admin" || profile.app_role === "region_admin";
  if (!isAdmin) {
    redirect("/dashboard");
  }

  // 1. Fetch aggregate stats
  const [
    membersRes,
    businessesRes,
    campaignsRes,
    allBusinessesRes,
    allCampaignsRes,
    allEventsRes
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("businesses").select("*", { count: "exact", head: true }),
    supabase.from("ad_campaigns").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("businesses").select("id, brand_name, category, city, ym_region"),
    supabase.from("ad_campaigns").select("id, status, boost_multiplier, business_id, created_at"),
    supabase.from("analytics_events").select("id, event_type, business_id, created_at")
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full uppercase tracking-widest block w-fit">
          System Intelligence
        </div>
        <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-tight mt-2">
          Directory Analytics Hub
        </h1>
        <p className="text-slate-500 font-light text-base">
          Real-time aggregations of traffic, registrations, category divisions, and active campaign reach.
        </p>
      </div>

      <AnalyticsClient
        initialMembersCount={membersRes.count || 0}
        businesses={allBusinessesRes.data || []}
        campaigns={allCampaignsRes.data || []}
        events={allEventsRes.data || []}
      />
    </div>
  );
}
