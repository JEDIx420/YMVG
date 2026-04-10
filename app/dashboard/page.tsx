import { getOrSyncBusiness } from "@/app/actions/getOrSyncBusiness";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import EditBusinessForm from "@/components/dashboard/EditBusinessForm";
import Link from "next/link";
import { ExternalLink, LayoutDashboard } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { business, error } = await getOrSyncBusiness();

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!business ? (
          <div className="bg-white shadow-xl rounded-2xl p-12 text-center border border-slate-100 max-w-2xl mx-auto">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <LayoutDashboard className="w-10 h-10 text-slate-400" />
            </div>
            <h1 className="text-3xl font-black text-blue-950 mb-4">No Business Registered</h1>
            <p className="text-slate-600 leading-relaxed mb-8">
              We couldn't find a pre-registered YMI business linked to your email address (<strong>{user.email}</strong>). 
              The directory is currently invitation-only for existing SWIR members.
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center justify-center px-8 py-3 bg-blue-950 text-white rounded-full font-bold hover:bg-black transition-all"
            >
              Return to Homepage
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Header Area */}
            <div className="bg-white shadow-sm rounded-3xl p-8 md:p-12 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-widest mb-2">
                  Merchant Portal
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-blue-950 tracking-tight leading-tight">
                  Welcome to your Dashboard
                </h1>
                <p className="text-slate-500 text-lg font-light">
                  Manage your professional digital presence for <strong className="text-blue-900 font-bold">{business.brand_name}</strong>
                </p>
              </div>

              <Link 
                href={`/directory/${business.id}`}
                className="inline-flex items-center gap-3 px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 hover:border-blue-200 hover:text-blue-700 group transition-all"
              >
                <span>View Live Profile</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>

            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-black text-blue-950">Configuration</h2>
                <p className="text-slate-700 font-medium">Update your branding, services, and contact details.</p>
              </div>
              <EditBusinessForm business={business} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
