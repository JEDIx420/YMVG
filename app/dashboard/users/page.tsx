import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/profiles";
import { createClient } from "@/utils/supabase/server";
import UserAuditTabs from "./UserAuditTabs";
import type { RegistrationRequest, SwirClub } from "@/types/database.types";

export const metadata = {
  title: "User Audit - System Console",
  description: "Monitor and audit user profiles, roles, and registrations.",
};

export default async function UserAuditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  if (!profile || !["review_admin", "super_admin"].includes(profile.app_role)) {
    redirect("/dashboard");
  }

  // Fetch profiles and businesses concurrently
  const [profilesRes, businessesRes, requestsRes, clubsRes] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("businesses").select("id, brand_name, owner_id, owner_profile_id"),
    supabase.rpc("list_registration_requests", { p_status: null }),
    supabase.rpc("list_selectable_swir_clubs"),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full uppercase tracking-widest block w-fit">
          Access Control Audit
        </div>
        <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-tight mt-2">
          Directory Members Audit
        </h1>
        <p className="text-slate-500 font-light text-base">
          Audit system-wide profiles, verify club registrations, and view authorization tiers.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <UserAuditTabs
          profiles={profilesRes.data || []}
          businesses={businessesRes.data || []}
          requests={(requestsRes.data || []) as RegistrationRequest[]}
          clubs={(clubsRes.data || []) as SwirClub[]}
        />
      </div>
    </div>
  );
}
