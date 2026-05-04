"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User, MapPin, Mail, Phone, ArrowLeft, Tag, Info, Gift } from "lucide-react";
import { Business } from "@/types/database.types";
import { motion } from "framer-motion";
import EnquiryModal from "@/components/EnquiryModal";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BusinessSpotlightPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);

  useEffect(() => {
    async function fetchBusiness() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error || !data) {
        setBusiness(null);
      } else {
        setBusiness(data as Business);
      }
      setIsLoading(false);
    }
    fetchBusiness();
  }, [id]);

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400 uppercase tracking-widest">Loading Spotlight...</div>;
  }

  if (!business) {
    notFound();
  }

  const b = business;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-hidden">
      {/* STEP 1: Hero Banner with Entrance Animation */}
      <section className="relative h-64 md:h-96 bg-blue-950 overflow-hidden">
        {b.primary_image_url ? (
          <Image 
            src={b.primary_image_url}
            alt={b.brand_name || "Business"}
            fill
            className="object-cover opacity-40"
            priority
          />
        ) : (
          <motion.div 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.2 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-gradient-to-r from-blue-950 to-blue-900"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
          </motion.div>
        )}
        <div className="absolute inset-0 bg-blue-950/20"></div>

        <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link 
              href="/directory" 
              className="absolute top-8 left-4 sm:left-6 lg:left-8 inline-flex items-center text-blue-200 hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Directory
            </Link>
          </motion.div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-12 text-center md:text-left">
            {/* Left Column: Business Name & Category (60%) */}
            <div className="md:w-[60%] space-y-4">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center px-4 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md shadow-lg shadow-red-900/40"
              >
                {b.category || "General"}
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight"
              >
                {b.brand_name || "Unnamed Business"}
              </motion.h1>
            </div>

            {/* Right Column: Logo & Tagline (40%) */}
            <div className="md:w-[40%] flex flex-col items-center gap-6">
              {b.logo_url ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, rotateY: 15 }}
                  animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                  transition={{ delay: 0.35, duration: 0.8 }}
                  className="w-32 h-32 md:w-44 md:h-44 rounded-3xl bg-white/10 backdrop-blur-xl p-3 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex-shrink-0 flex items-center justify-center relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white p-2">
                    <Image 
                      src={b.logo_url} 
                      alt={b.brand_name || "Logo"} 
                      fill 
                      className="object-contain"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="w-32 h-32 md:w-44 md:h-44 rounded-3xl bg-blue-900 border-2 border-blue-400/30 flex items-center justify-center text-5xl font-black text-white shadow-2xl flex-shrink-0"
                >
                  {b.brand_name?.charAt(0) || b.owner_name?.charAt(0) || "Y"}
                </motion.div>
              )}

              {b.tagline && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-lg md:text-xl text-blue-100 italic font-light tracking-wide text-center"
                >
                  "{b.tagline}"
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* STEP 2: Main Layout Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: 2/3 Content */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-2 space-y-12"
          >
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
                    <motion.div 
                      key={idx} 
                      whileHover={{ x: 5, backgroundColor: "#172554", color: "#fff" }}
                      className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 font-medium cursor-default transition-colors"
                    >
                      <div className="w-2 h-2 bg-red-600 rounded-full mr-4"></div>
                      {service}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Offer */}
            {b.special_offer && (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-red-50 border-l-8 border-red-600 rounded-3xl p-8 md:p-12 shadow-lg shadow-red-900/5 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 transition-transform group-hover:scale-110">
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
              </motion.div>
            )}
          </motion.div>

          {/* Right Column: 1/3 Sticky Action Card */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="sticky top-24 space-y-8"
            >
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="bg-white rounded-3xl p-8 shadow-2xl shadow-blue-900/10 border border-slate-100"
              >
                <h3 className="text-lg font-black text-blue-950 uppercase tracking-tight mb-8">Verification & Contact</h3>
                
                <div className="space-y-6 mb-10">
                  <div className="flex items-start">
                    <div className="bg-slate-100 p-2 rounded-lg mr-4 text-slate-500">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Owner</p>
                      <p className="text-blue-950 font-bold">{b.owner_name || "Y's Member"}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-slate-100 p-2 rounded-lg mr-4 text-slate-500">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Affiliation</p>
                      <p className="text-blue-950 font-bold">{b.ym_club} Club</p>
                      <p className="text-sm text-slate-500 leading-relaxed mt-1">
                        {[
                          b.ym_district && `District ${b.ym_district}`,
                          b.ym_zone && `Zone ${b.ym_zone}`,
                          b.ym_region && `${b.ym_region} Region`
                        ].filter(Boolean).join(' • ')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => setIsEnquiryModalOpen(true)}
                    className="w-full inline-flex items-center justify-center p-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-red-600/30 text-lg cursor-pointer"
                  >
                    <Mail className="w-5 h-5 mr-3" />
                    Enquire Now
                  </button>

                  {b.brochure_url && (
                    <a 
                      href={b.brochure_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center p-3.5 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 font-bold rounded-2xl transition-all shadow-sm text-base cursor-pointer"
                    >
                      Download Brochure
                    </a>
                  )}
                  
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

                <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="inline-flex items-center text-[10px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full"
                  >
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    Identity Verified
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>

        </div>
      </main>

      <EnquiryModal 
        isOpen={isEnquiryModalOpen} 
        onClose={() => setIsEnquiryModalOpen(false)}
        businessId={b.id}
        businessName={b.brand_name || "this business"}
      />
    </div>
  );
}
