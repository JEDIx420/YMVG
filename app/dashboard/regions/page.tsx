import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/profiles";
import { createClient } from "@/utils/supabase/server";
import { MapPin, Building2, Globe, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Regions Directory - System Administration",
  description: "Monitor directory clusters across physical geographic clubs and regions.",
};

export default async function RegionsDirectoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  if (!profile || (profile.app_role !== "super_admin" && profile.app_role !== "region_admin")) {
    redirect("/dashboard");
  }

  // Fetch unique regions and counts of businesses
  const { data: businesses } = await supabase
    .from("businesses")
    .select("ym_region, city");

  const regionMap: { [key: string]: { count: number; cities: Set<string> } } = {};
  if (businesses) {
    businesses.forEach((b) => {
      const reg = b.ym_region || "Unassigned Region";
      const city = b.city || "Unassigned City";
      if (!regionMap[reg]) {
        regionMap[reg] = { count: 0, cities: new Set() };
      }
      regionMap[reg].count += 1;
      regionMap[reg].cities.add(city);
    });
  }

  const regions = Object.entries(regionMap).map(([name, data]) => ({
    name,
    count: data.count,
    cities: Array.from(data.cities).filter(Boolean),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full uppercase tracking-widest block w-fit">
          Regional Clusters
        </div>
        <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-tight mt-2">
          SWIR Regions Console
        </h1>
        <p className="text-slate-500 font-light text-base">
          Analyze business registration densities, club geographical spreads, and community scopes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {regions.length === 0 ? (
          <p className="text-slate-400 text-center py-10 col-span-full">No regional directory classifications recorded.</p>
        ) : (
          regions.map((reg) => (
            <div key={reg.name} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center border border-red-100 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{reg.name}</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">SWIR Territory</span>
                </div>
                
                <div className="pt-2">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider leading-none">Registered Cities:</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {reg.cities.length === 0 ? (
                      <span className="text-[10px] text-slate-400 italic">No city listings</span>
                    ) : (
                      reg.cities.map((city) => (
                        <span key={city} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-md">
                          {city}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>{reg.count} Enterprise{reg.count !== 1 ? "s" : ""}</span>
                </div>
                <Link
                  href={`/directory?region=${encodeURIComponent(reg.name)}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-950 hover:text-red-600 transition-colors"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
