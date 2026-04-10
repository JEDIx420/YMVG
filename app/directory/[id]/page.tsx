import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { User, MapPin, Mail, Phone, ArrowLeft, Tag, Info, Gift } from "lucide-react";
import { Business } from "@/types/database.types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BusinessSpotlightPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: business, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !business) {
    notFound();
  }

  const b = business as Business;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* STEP 1: Hero Banner */}
      <section className="relative h-64 md:h-80 bg-gradient-to-r from-blue-950 to-blue-900 overflow-hidden">
        {/* Decorative mask */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12">
          <Link 
            href="/directory" 
            className="absolute top-8 left-4 sm:left-6 lg:left-8 inline-flex items-center text-blue-200 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Directory
          </Link>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md shadow-lg shadow-red-900/20">
                {b.category || "General"}
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
                {b.brand_name || "Unnamed Business"}
              </h1>
              {b.tagline && (
                <p className="text-xl text-blue-100 italic font-light">
                  "{b.tagline}"
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* STEP 2: Main Layout Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: 2/3 Content */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* About Section */}
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <Info className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-blue-950 uppercase tracking-tight">About the Business</h2>
              </div>
              <p className="text-lg text-slate-700 leading-relaxed font-light">
                {b.description || "No description provided for this business."}
              </p>
            </div>

            {/* Services Grid */}
            {b.services && b.services.length > 0 && (
              <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <Tag className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-blue-950 uppercase tracking-tight">Services & Expertise</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {b.services.map((service, idx) => (
                    <div key={idx} className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 font-medium group hover:bg-blue-950 hover:text-white transition-all cursor-default">
                      <div className="w-2 h-2 bg-red-600 rounded-full mr-4 group-hover:bg-red-400 transition-colors"></div>
                      {service}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Offer */}
            {b.special_offer && (
              <div className="bg-red-50 border-l-8 border-red-600 rounded-3xl p-8 md:p-12 shadow-lg shadow-red-900/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Gift className="w-24 h-24 text-red-600" />
                </div>
                <div className="relative">
                  <h3 className="text-2xl font-bold text-red-900 mb-4 flex items-center">
                    <Gift className="w-6 h-6 mr-3" />
                    Special Member Offer
                  </h3>
                  <p className="text-xl text-red-800 leading-relaxed font-medium">
                    {b.special_offer}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: 1/3 Sticky Action Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-blue-900/10 border border-slate-100">
                <h3 className="text-lg font-black text-blue-950 uppercase tracking-tight mb-8">Verification & Contact</h3>
                
                <div className="space-y-6 mb-10">
                  <div className="flex items-start">
                    <div className="bg-slate-100 p-2 rounded-lg mr-4">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Owner</p>
                      <p className="text-blue-950 font-bold">{b.owner_name || "Y's Member"}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-slate-100 p-2 rounded-lg mr-4">
                      <MapPin className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Affiliation</p>
                      <p className="text-blue-950 font-bold">{b.ym_club} Club</p>
                      <p className="text-sm text-slate-500">{b.ym_region} Region</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <a 
                    href={`mailto:${b.contact_email}`}
                    className="w-full inline-flex items-center justify-center p-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-red-600/30 active:scale-95 text-lg"
                  >
                    <Mail className="w-5 h-5 mr-3" />
                    Enquire Now
                  </a>
                  
                  <div className="pt-4 space-y-3">
                    {b.contact_email && (
                      <div className="flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors">
                        <Mail className="w-4 h-4 mr-3 opacity-50" />
                        {b.contact_email}
                      </div>
                    )}
                    {b.contact_phone && (
                      <div className="flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors">
                        <Phone className="w-4 h-4 mr-3 opacity-50" />
                        {b.contact_phone}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100">
                  <div className="inline-flex items-center text-[10px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Identity Verified
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
