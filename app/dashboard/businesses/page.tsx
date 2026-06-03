import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/profiles";
import { createClient } from "@/utils/supabase/server";
import { Briefcase, Building2, MapPin, Shield, Calendar, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Business Audit - System Administration",
  description: "Monitor and audit business registry profiles, category distributions, and details.",
};

export default async function BusinessDirectoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  if (!profile || (profile.app_role !== "super_admin" && profile.app_role !== "region_admin")) {
    redirect("/dashboard");
  }

  // Fetch all registered businesses
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("*")
    .order("brand_name", { ascending: true });

  if (error) {
    console.error("Error fetching businesses:", error);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full uppercase tracking-widest block w-fit">
          Merchant Audits
        </div>
        <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-tight mt-2">
          Listed Businesses Audit
        </h1>
        <p className="text-slate-500 font-light text-base">
          Audit directory business entries, modify listings, and verify organization claims.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
        <h3 className="text-xl font-black text-blue-950 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-4">
          <Briefcase className="w-5 h-5 text-red-600" />
          <span>Active Registry Directory</span>
        </h3>

        {!businesses || businesses.length === 0 ? (
          <p className="text-slate-400 text-center py-10">No listings found in the database.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-4 px-4">Business Listing</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Club / Region</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {businesses.map((b) => {
                  return (
                    <tr key={b.id} className="text-sm font-semibold text-slate-700">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                            {b.logo_url ? (
                              <img src={b.logo_url} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                              <Building2 className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                          <div>
                            <p className="text-slate-900 font-bold leading-none">{b.brand_name || "Unnamed Enterprise"}</p>
                            <span className="text-[10px] font-medium text-slate-400 block mt-1 leading-none">{b.contact_email || "No Email"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100/50 uppercase tracking-wider">
                          {b.category || "Professional"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-500 font-light flex items-center gap-1.5 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b.city || "Unknown City"} ({b.ym_region || "Unknown Region"})</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <Link 
                            href={`/directory/${b.id}`}
                            className="inline-flex items-center justify-center w-8 h-8 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shrink-0 cursor-pointer"
                            title="View Live Listing"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/dashboard/business/${b.id}/edit`}
                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            <span>Edit Listing</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
