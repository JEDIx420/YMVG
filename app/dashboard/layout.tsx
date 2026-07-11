import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/profiles";
import Sidebar from "@/components/dashboard/Sidebar";
import ProfileOnboardingForm from "@/components/forms/ProfileOnboardingForm";
import { Shield } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Fetch current profile from Server Action
  const profile = await getCurrentProfile();

  // 2. Security Check: If user is not authenticated, redirect to login page
  if (!profile) {
    redirect("/login");
  }

  // 3. Soft-gating: If profile is incomplete, force onboarding directly in the layout
  const isIncompleteProfile = !profile.phone || !profile.club || !profile.full_name;

  if (isIncompleteProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        <div className="relative max-w-md w-full bg-white/95 backdrop-blur-md px-8 py-10 rounded-3xl border border-white/20 shadow-2xl space-y-6">
          
          {/* Onboarding Header Branding */}
          <div className="text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-inner">
              <Shield className="w-8 h-8 text-blue-900" />
            </div>
            <h2 className="text-2xl font-black text-blue-950 tracking-tight leading-tight">Complete Your Profile</h2>
            <p className="text-slate-500 text-sm mt-1.5 font-light">Join the Y's Men International SWIR digital hub to access member networking and directories.</p>
          </div>

          {/* Profile Onboarding Form */}
          <ProfileOnboardingForm 
            initialEmail={profile.email} 
            initialName={profile.full_name} 
            profile={profile}
          />
        </div>
      </div>
    );
  }

  // 4. Role-based Dashboard Shell Rendering
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Dynamic Navigation Sidebar */}
      <Sidebar profile={profile} />

      {/* Primary Dashboard Content Area */}
      <main className="flex-1 min-w-0 bg-slate-50 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
