"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User, MapPin, Mail, Phone, ArrowLeft, Tag, Info, Gift, Shield, Share2, Check } from "lucide-react";
import { Business } from "@/types/database.types";
import { motion, AnimatePresence } from "framer-motion";
import { logAnalyticsEvent } from "@/app/actions/logAnalyticsEvent";

interface PageProps {
  params: Promise<{ id: string }>;
}

const getWhatsAppLink = (phone: string, brandName: string) => {
  const cleanPhone = phone.replace(/\D/g, "");
  const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const message = encodeURIComponent(`Hi, I found your business "${brandName}" on the Y's Men's International Business Directory and would like to get in touch!`);
  return `https://wa.me/${phoneWithCountry}?text=${message}`;
};

export default function BusinessSpotlightPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // Fetch business details
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

  // Fetch current user's profile ID for generating referral links
  useEffect(() => {
    async function fetchUserProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();
        if (!error && data) {
          setCurrentUserProfileId(data.id);
        }
      }
    }
    fetchUserProfile();
  }, []);

  // Fire-and-forget background analytics log
  useEffect(() => {
    if (!business) return;

    const logEvent = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const refId = params.get("ref");
        await logAnalyticsEvent(business.id, refId);
      } catch (err) {
        console.error("Failed to log background analytics event:", err);
      }
    };
    logEvent();
  }, [business?.id]);


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
            sizes="100vw"
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
                      sizes="(max-width: 768px) 128px, 176px"
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
                      <Shield className="w-5 h-5" />
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

                  {(b.city || b.state || b.country) && (
                    <div className="flex items-start">
                      <div className="bg-slate-100 p-2 rounded-lg mr-4 text-slate-500">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Location</p>
                        <p className="text-blue-950 font-bold">
                          {[b.city, b.state, b.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {(b.contact_phone || b.owner_phone) && (
                    <a 
                      href={getWhatsAppLink(b.contact_phone || b.owner_phone || "", b.brand_name || "Business")}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center p-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-black rounded-2xl transition-all shadow-xl shadow-green-500/20 text-lg cursor-pointer hover:scale-[0.98] duration-300"
                    >
                      <svg className="w-5 h-5 mr-3 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.504-5.714-1.464L0 24zm6.59-4.846c1.6.95 3.198 1.451 4.811 1.453 5.46.002 9.902-4.439 9.905-9.899.002-2.646-1.03-5.132-2.903-7.006C16.587 1.826 14.1 1.795 12.005 1.795c-5.461 0-9.904 4.442-9.908 9.902-.001 1.765.46 3.486 1.336 5.006L2.392 21.62l5.127-1.344-.872-.544z" />
                        <path d="M16.917 13.913c-.267-.133-1.582-.78-1.828-.87-.246-.09-.425-.133-.604.134-.179.266-.693.87-.85 1.05-.156.183-.312.204-.579.07-.267-.134-1.127-.416-2.148-1.328-.793-.708-1.329-1.582-1.485-1.848-.156-.266-.017-.409.117-.542.12-.12.267-.312.4-.468.133-.156.179-.266.267-.442.09-.177.045-.333-.023-.468-.067-.134-.604-1.457-.827-1.993-.217-.523-.456-.452-.604-.452h-.515c-.179 0-.47.067-.716.333-.246.267-.938.917-.938 2.235 0 1.318.96 2.59 1.093 2.767.133.177 1.888 2.883 4.574 4.043.64.277 1.139.442 1.528.566.643.204 1.229.176 1.692.107.516-.077 1.582-.646 1.805-1.27.224-.623.224-1.157.157-1.27-.067-.113-.246-.179-.513-.313z" />
                      </svg>
                      Connect on WhatsApp
                    </a>
                  )}

                  {(b.contact_email || b.owner_email) && (
                    <a 
                      href={`mailto:${b.contact_email || b.owner_email}?subject=${encodeURIComponent(`Inquiry from Y's Men's International Business Directory - ${b.brand_name}`)}`}
                      className="w-full inline-flex items-center justify-center p-3.5 bg-blue-950 hover:bg-black text-white font-bold rounded-2xl transition-all shadow-sm text-base cursor-pointer hover:scale-[0.98] duration-300"
                    >
                      <Mail className="w-5 h-5 mr-3 text-red-500" />
                      Email Owner
                    </a>
                  )}

                  {/* Share Business / Unique Referral Link Button */}
                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/directory/${b.id}${currentUserProfileId ? `?ref=${currentUserProfileId}` : ""}`;
                      navigator.clipboard.writeText(shareUrl);
                      setShareCopied(true);
                      setTimeout(() => setShareCopied(false), 2000);
                    }}
                    className="w-full inline-flex items-center justify-center p-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-2xl transition-all shadow-md text-base cursor-pointer hover:scale-[0.98] duration-300 gap-2 border border-red-500/10"
                  >
                    {shareCopied ? (
                      <>
                        <Check className="w-5 h-5 text-emerald-300" />
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-5 h-5" />
                        <span>Share Business {currentUserProfileId && "(& Refer)"}</span>
                      </>
                    )}
                  </button>

                  {b.brochure_url && (
                    <a 
                      href={b.brochure_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center p-3.5 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 font-bold rounded-2xl transition-all shadow-sm text-base cursor-pointer hover:scale-[0.98] duration-300"
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

    </div>
  );
}
