import { getOrSyncBusiness } from "@/app/actions/getOrSyncBusiness";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Briefcase, Plus, Image as ImageIcon, Settings } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { businesses } = (await getOrSyncBusiness()) as { businesses: any[] };

  // Handle the Empty State
  if (!businesses || businesses.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-3xl font-black text-blue-950 mb-4">Welcome to the Y's Men's International Business Directory</h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8 max-w-lg">
              You haven't set up your business profile yet. Create one now to get discovered by the SWIR community.
            </p>
            <Link 
              href="/dashboard/onboarding" 
              className="inline-flex items-center justify-center px-8 py-3 bg-blue-950 text-white rounded-full font-bold hover:bg-black transition-all"
            >
              Create Your Business Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Portfolio Grid State
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-widest mb-2">
              Merchant Portfolio
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-blue-950 tracking-tight leading-tight">
              Welcome to your Dashboard
            </h1>
            <p className="text-slate-500 text-lg font-light">
              Manage your digital presence across {businesses.length} {businesses.length === 1 ? 'business' : 'businesses'}.
            </p>
          </div>

          <Link 
            href="/dashboard/onboarding"
            className="inline-flex items-center gap-2 px-6 py-4 bg-blue-950 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl hover:shadow-black/20 shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Business</span>
          </Link>
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
            <div key={business.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
              
              <div className="p-6 flex-1 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    {business.logo_url ? (
                      <img src={business.logo_url} alt={business.brand_name || 'Logo'} className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {business.category || 'Uncategorized'}
                  </span>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {business.brand_name || 'Unnamed Business'}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                    {business.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex items-center gap-3">
                <Link 
                  href={`/dashboard/business/${business.id}/edit`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  <Settings className="w-4 h-4" />
                  Edit Profile
                </Link>
                <Link 
                  href={`/directory/${business.id}`}
                  className="inline-flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shrink-0"
                  title="View Live Profile"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
