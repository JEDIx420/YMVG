import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/profiles";
import Sidebar from "@/components/dashboard/Sidebar";

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
