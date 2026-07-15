import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/profiles";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import AnalyticsClient from "./AnalyticsClient";
import OwnerAnalyticsClient from "./OwnerAnalyticsClient";

export const metadata = {
  title: "Analytics Dashboard - Business Directory",
  description: "View real-time analytics data across regions, categories, and ad campaigns.",
};

type Params = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AnalyticsPage(props: { searchParams: Params }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const isOwnerView = searchParams.view === "owner" || profile.app_role === "business_owner";
  const isAdmin = profile.app_role === "super_admin" || profile.app_role === "review_admin";

  // Gate access: must be admin or business owner
  if (!isAdmin && profile.app_role !== "business_owner") {
    redirect("/dashboard");
  }

  // Initialize admin client to bypass RLS for leaderboards/cross-reference queries safely on server side
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (isOwnerView) {
    // OWNER VIEW: Fetch owner's specific businesses and their events
    const { data: ownerBusinesses, error: bizError } = await supabase
      .from("businesses")
      .select("id, brand_name")
      .eq("owner_id", user.id);

    if (bizError || !ownerBusinesses || ownerBusinesses.length === 0) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <h1 className="text-3xl font-black text-blue-950">Attribution Analytics</h1>
          <p className="text-slate-500">You must register a business listing first to view traffic analytics.</p>
        </div>
      );
    }

    const businessIds = ownerBusinesses.map(b => b.id);

    // Fetch analytics events scoped to the owner's businesses, joining with profiles for referral details
    const { data: events } = await supabaseAdmin
      .from("analytics_events")
      .select(`
        id,
        event_type,
        business_id,
        referrer_profile_id,
        created_at,
        profiles:referrer_profile_id (
          id,
          full_name,
          email,
          club
        )
      `)
      .in("business_id", businessIds);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full uppercase tracking-widest block w-fit">
            Merchant Intelligence
          </div>
          <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-tight mt-2">
            Showcase & Referral Insights
          </h1>
          <p className="text-slate-500 font-light text-base">
            Track views, referrals, and member attribution details for your listed enterprises.
          </p>
        </div>

        <OwnerAnalyticsClient
          businesses={ownerBusinesses}
          events={events || []}
        />
      </div>
    );
  }

  // ADMIN VIEW: Fetch directory-wide aggregate stats
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
