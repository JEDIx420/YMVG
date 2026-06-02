import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/profiles";
import { createClient } from "@/utils/supabase/server";
import AdminView from "../components/AdminView";
import MemberView from "../components/MemberView";
import BusinessOwnerView from "../components/BusinessOwnerView";
import { BarChart3, TrendingUp, Sparkles, Building2, MapPin, Users, Briefcase } from "lucide-react";

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
    supabase.from("businesses").select("id, category, city, ym_region"),
    supabase.from("ad_campaigns").select("id, status, boost_multiplier"),
    supabase.from("analytics_events").select("id, event_type")
  ]);

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
    .sort((a, b) => b.count - a.count);

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
    count,
  }));

  // Aggregate Regional Stats
  const regionCounts: { [key: string]: number } = {};
  if (allBusinessesRes.data) {
    allBusinessesRes.data.forEach((b: any) => {
      const reg = b.ym_region || "Unassigned";
      regionCounts[reg] = (regionCounts[reg] || 0) + 1;
    });
  }
  const regionStats = Object.entries(regionCounts)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);

  const viewsCount = allEventsRes.data?.filter((e: any) => e.event_type === "view").length || 0;
  const referralsCount = allEventsRes.data?.filter((e: any) => e.event_type === "referral").length || 0;

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

      {/* Analytics Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Total Members</p>
            <p className="text-2xl font-black text-blue-950 mt-1 leading-none">{membersRes.count || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Listed Businesses</p>
            <p className="text-2xl font-black text-blue-950 mt-1 leading-none">{businessesRes.count || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Active Boosts</p>
            <p className="text-2xl font-black text-blue-950 mt-1 leading-none">{campaignsRes.count || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 border border-red-100 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Traffic Clicks</p>
            <p className="text-2xl font-black text-blue-950 mt-1 leading-none">{viewsCount + referralsCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Category stats chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-blue-950 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
            <Briefcase className="w-4 h-4 text-red-600" />
            <span>Category Distribution</span>
          </h3>
          <div className="space-y-4">
            {categoryStats.length === 0 ? (
              <p className="text-slate-400 text-sm font-light">No category metrics found.</p>
            ) : (
              categoryStats.map((item) => {
                const total = businessesRes.count || 1;
                const percent = Math.round((item.count / total) * 100);
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{item.category}</span>
                      <span>{item.count} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-blue-950 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Region stats chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-blue-950 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="w-4 h-4 text-red-600" />
            <span>Regional Distribution</span>
          </h3>
          <div className="space-y-4">
            {regionStats.length === 0 ? (
              <p className="text-slate-400 text-sm font-light">No regional metrics found.</p>
            ) : (
              regionStats.map((item) => {
                const total = businessesRes.count || 1;
                const percent = Math.round((item.count / total) * 100);
                return (
                  <div key={item.region} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{item.region}</span>
                      <span>{item.count} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
