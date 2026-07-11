import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/profiles";
import { createClient } from "@/utils/supabase/server";
import PersonalProfileForm from "@/components/forms/PersonalProfileForm";
import { User } from "lucide-react";

export const metadata = {
  title: "My Profile - Business Directory Dashboard",
  description: "View and update your personal user profile details.",
};

export default async function ProfileDashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/");
  }

  // Fetch linked enterprises from public.businesses where owner_profile_id = profile.id or owner_email = profile.email
  const supabase = await createClient();
  const { data: linkedBusinesses, error } = await supabase
    .from("businesses")
    .select("id, brand_name, category, logo_url, sponsorship_tier")
    .or(`owner_profile_id.eq.${profile.id},owner_email.eq.${profile.email}`);

  if (error) {
    console.error("Error fetching linked businesses:", error);
  }

  const businesses = linkedBusinesses || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Page Header */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group">
        {/* Background ambient glow */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700"></div>

        <div className="space-y-2 relative z-10">
          <span className="px-3 py-1 bg-blue-950/60 text-blue-300 border border-blue-900/50 text-xs font-bold rounded-full uppercase tracking-widest block w-fit">
            Settings
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight leading-tight mt-2 flex items-center gap-3">
            <User className="w-8 h-8 text-blue-400" />
            <span>My Profile</span>
          </h1>
          <p className="text-slate-400 font-light text-base">
            Manage your personal profile information, location attributes, and club credentials.
          </p>
        </div>
      </div>

      {/* Profile Form Card */}
      <PersonalProfileForm profile={profile} linkedBusinesses={businesses} />
    </div>
  );
}
