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
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full uppercase tracking-widest block w-fit">
            Settings
          </span>
          <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-tight mt-2 flex items-center gap-3">
            <User className="w-8 h-8 text-blue-955" />
            <span>My Profile</span>
          </h1>
          <p className="text-slate-500 font-light text-base">
            Manage your personal profile information, location attributes, and club credentials.
          </p>
        </div>
      </div>

      {/* Profile Form Card */}
      <PersonalProfileForm profile={profile} linkedBusinesses={businesses} />
    </div>
  );
}
