import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Plus, Briefcase } from "lucide-react";

export const metadata = {
  title: "My Business - Business Directory Dashboard",
  description: "Manage your registered business directory listing.",
};

export default async function BusinessIndexPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the user's business profile
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  // If a business is already registered, redirect directly to its edit page
  if (business) {
    redirect(`/dashboard/business/${business.id}/edit`);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Briefcase className="w-8 h-8" />
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h1 className="text-2xl font-black text-blue-950 uppercase tracking-tight">No Active Listing Found</h1>
          <p className="text-slate-500 font-light text-sm">
            You don't have an active business listed under your member account yet. Register your company to start capturing leads and accessing premium search promotions.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/dashboard/onboarding"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all text-xs active:scale-95 shadow-md shadow-red-600/10"
          >
            <Plus className="w-4 h-4" />
            <span>Create Business Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
