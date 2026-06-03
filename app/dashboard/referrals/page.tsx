import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/profiles";
import { createClient } from "@/utils/supabase/server";
import ReferralsClient from "./ReferralsClient";

export const metadata = {
  title: "Referral Hub - Business Directory Dashboard",
  description: "View your verified referral metrics and link status.",
};

export default async function ReferralsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  // Fetch the count of referral clicks from analytics_events where referrer_profile_id matches this profile
  const { count: referralCount } = await supabase
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("referrer_profile_id", profile.id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full uppercase tracking-widest block w-fit">
            Y's Men Member
          </span>
          <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-tight mt-2">
            Referral Hub
          </h1>
          <p className="text-slate-500 font-light text-base">
            Track your contribution to the regional ecosystem and view real-time traffic statistics from your custom sharing link.
          </p>
        </div>
      </div>

      {/* Referrals Client */}
      <ReferralsClient profileId={profile.id} referralCount={referralCount || 0} />
    </div>
  );
}
