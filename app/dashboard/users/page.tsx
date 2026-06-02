import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/profiles";
import { createClient } from "@/utils/supabase/server";
import { Users, Mail, Phone, MapPin, Shield, Calendar } from "lucide-react";

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
  if (!profile || (profile.app_role !== "super_admin" && profile.app_role !== "region_admin")) {
    redirect("/dashboard");
  }

  // Fetch all profiles from Supabase
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

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

      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
        <h3 className="text-xl font-black text-blue-950 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-4">
          <Users className="w-5 h-5 text-red-600" />
          <span>Active Accounts Directory</span>
        </h3>

        {!profiles || profiles.length === 0 ? (
          <p className="text-slate-400 text-center py-10">No member accounts found in the database.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-4 px-4">Member Name</th>
                  <th className="py-4 px-4">Role Tier</th>
                  <th className="py-4 px-4">Club Affiliation</th>
                  <th className="py-4 px-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {profiles.map((p) => {
                  const joinedFormatted = new Date(p.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr key={p.id} className="text-sm font-semibold text-slate-700">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-900 to-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {(p.full_name || "?").charAt(0)}
                          </div>
                          <div>
                            <p className="text-slate-900 font-bold leading-none">{p.full_name || "Nexus User"}</p>
                            <span className="text-[10px] font-medium text-slate-400 block mt-1 leading-none">{p.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                          p.app_role === "super_admin" 
                            ? "bg-red-50 text-red-700 border-red-100" 
                            : p.app_role === "region_admin"
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : p.app_role === "business_owner"
                                ? "bg-blue-50 text-blue-700 border-blue-100"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {p.app_role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-500 font-light flex items-center gap-1.5 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.club || "Unspecified Club"}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-400 font-light text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-300" />
                          <span>{joinedFormatted}</span>
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
