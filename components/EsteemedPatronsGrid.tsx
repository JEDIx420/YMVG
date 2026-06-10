import { createAdminClient } from "@/utils/supabase/admin";
import { Building2 } from "lucide-react";

export default async function EsteemedPatronsGrid() {
  const supabase = createAdminClient();
  
  // Only fetch records where campaign_type = 'homepage_patron' AND status = 'active'
  const { data, error } = await supabase
    .from("ad_campaigns")
    .select(`
      id,
      status,
      start_date,
      end_date,
      campaign_type,
      businesses (
        id,
        brand_name,
        logo_url,
        website_url
      )
    `, { count: "exact", head: false })
    .eq("campaign_type", "homepage_patron")
    .eq("status", "active");

  if (error || !data) {
    console.error("Error fetching patrons:", error);
    return null;
  }

  // Filter campaigns that are currently active based on current system date
  const now = new Date();
  const patrons = data
    .filter((c: any) => {
      const start = new Date(c.start_date);
      const end = new Date(c.end_date);
      return now >= start && now <= end && c.businesses;
    })
    .map((c: any) => ({
      campaignId: c.id,
      businessId: c.businesses.id,
      brandName: c.businesses.brand_name,
      logoUrl: c.businesses.logo_url,
      websiteUrl: c.businesses.website_url,
    }));

  if (patrons.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-white border-t border-slate-100 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full uppercase tracking-widest block w-fit mx-auto">
            Our Well Wishers
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-blue-950 tracking-tight mt-2">
            Our Homepage Patrons
          </h2>
          <div className="w-16 h-1 bg-red-600 mx-auto rounded-full mt-4"></div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8">
          {patrons.map((patron) => (
            <a
              key={patron.campaignId}
              href={patron.websiteUrl || `/directory/${patron.businessId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 bg-slate-50 border border-slate-200/50 rounded-3xl flex items-center justify-center h-24 w-48 hover:shadow-lg hover:border-red-600/30 hover:scale-105 transition-all duration-300 shadow-sm cursor-pointer hover:ring-4 hover:ring-red-50/50"
              title={patron.brandName}
            >
              {patron.logoUrl ? (
                <img 
                  src={patron.logoUrl} 
                  alt={patron.brandName} 
                  className="max-h-full max-w-full object-contain" 
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-xs text-slate-400 line-clamp-2">
                    {patron.brandName}
                  </span>
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
