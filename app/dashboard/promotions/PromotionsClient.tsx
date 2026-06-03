"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createAdCampaign, pauseCampaign } from "@/app/actions/adCampaigns";
import { Profile } from "@/types/database.types";
import {
  TrendingUp,
  Sparkles,
  Calendar,
  Building2,
  Play,
  Pause,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Percent,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BusinessListItem {
  id: string;
  brand_name: string | null;
  category: string | null;
  logo_url: string | null;
  city: string | null;
  website_url: string | null;
}

interface CampaignItem {
  id: string;
  business_id: string;
  status: string;
  boost_multiplier: number;
  campaign_type: string;
  start_date: string;
  end_date: string;
  created_at: string;
  businesses: {
    brand_name: string | null;
    category: string | null;
    logo_url: string | null;
  } | null;
}

interface PromotionsClientProps {
  profile: Profile;
  businesses: BusinessListItem[];
  initialCampaigns: CampaignItem[];
}

const BOOST_TIERS = [
  {
    name: "Bronze Boost",
    multiplier: 1.2,
    description: "+20% weight in Reciprocal Rank Fusion search rankings.",
    color: "from-amber-600 to-amber-800",
    textColor: "text-amber-700",
    bgColor: "bg-amber-50/50",
    borderColor: "border-amber-200/60",
  },
  {
    name: "Silver Boost",
    multiplier: 1.5,
    description: "+50% weight in Reciprocal Rank Fusion search rankings.",
    color: "from-slate-400 to-slate-600",
    textColor: "text-slate-700",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-300/60",
  },
  {
    name: "Gold Boost",
    multiplier: 2.0,
    description: "2x weight. Pushes listing straight into top results.",
    color: "from-yellow-500 to-yellow-600",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50/40",
    borderColor: "border-yellow-300/60",
    recommended: true,
  },
  {
    name: "Platinum Boost",
    multiplier: 3.0,
    description: "3x weight. Absolute maximum search visibility.",
    color: "from-blue-600 to-slate-900",
    textColor: "text-blue-900",
    bgColor: "bg-blue-50/30",
    borderColor: "border-blue-200/60",
  },
];

export default function PromotionsClient({
  profile,
  businesses,
  initialCampaigns,
}: PromotionsClientProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(initialCampaigns);
  const [selectedBusinessId, setSelectedBusinessId] = useState(
    businesses[0]?.id || ""
  );
  const [campaignType, setCampaignType] = useState<"search_boost" | "homepage_patron">("search_boost");
  const [selectedBoost, setSelectedBoost] = useState(1.5);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const selectedBusiness = businesses.find((b) => b.id === selectedBusinessId);
  const hasLogoAndWebsite = !!(selectedBusiness?.logo_url && selectedBusiness?.website_url);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusinessId) {
      setStatus({
        type: "error",
        message: "Please select a business listing to boost.",
      });
      return;
    }

    if (campaignType === "homepage_patron" && !hasLogoAndWebsite) {
      setStatus({
        type: "error",
        message: "Your listing must have a logo and website URL configured to request a Homepage Patron slot.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const result = await createAdCampaign({
        businessId: selectedBusinessId,
        campaignType,
        boostMultiplier: campaignType === "search_boost" ? selectedBoost : 1.0,
        startDate,
        endDate,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to submit promotion request.");
      }

      setStatus({
        type: "success",
        message:
          "Sponsorship request submitted successfully! Pending admin approval.",
      });

      // Reset form states
      setCampaignType("search_boost");
      setSelectedBoost(1.5);
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      );

      // Re-fetch/update local campaigns list
      setTimeout(() => {
        router.refresh();
        setStatus(null);
      }, 2000);
    } catch (error: any) {
      console.error(error);
      setStatus({
        type: "error",
        message: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePause = async (campaignId: string) => {
    setActionLoadingId(campaignId);
    try {
      const res = await pauseCampaign(campaignId);
      if (!res.success) throw new Error(res.error || "Failed to pause campaign.");
      
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? { ...c, status: "paused" } : c))
      );
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Could not complete action.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100 uppercase tracking-wider">
            <Clock className="w-3 h-3" />
            Pending Review
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 uppercase tracking-wider">
            Paused
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 uppercase tracking-wider">
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-100 uppercase tracking-wider">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full uppercase tracking-widest block w-fit">
            Sponsorship & Promotions
          </div>
          <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-tight mt-2">
            Search Visibility Portal
          </h1>
          <p className="text-slate-500 font-light text-base">
            Multiply your directory listing ranking using search boost multipliers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Side: Create Campaign Form (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-blue-950 uppercase tracking-tight flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <Sparkles className="w-5 h-5 text-red-600" />
              <span>Configure Search Sponsorship Boost</span>
            </h3>

            <AnimatePresence>
              {status && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-4 rounded-2xl flex items-center gap-3 border ${
                    status.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  {status.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0" />
                  )}
                  <span className="font-medium text-sm">{status.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {businesses.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200/50">
                <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 mb-1">No Active Listings</h4>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                  You need a registered business directory profile before launching a sponsorship boost campaign.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Listing selection */}
                {/* Listing selection */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-blue-950 uppercase tracking-wider block">
                    Select Target Enterprise listing
                  </label>
                  <div className="relative">
                    <select
                      value={selectedBusinessId}
                      onChange={(e) => setSelectedBusinessId(e.target.value)}
                      className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-800 text-sm font-semibold cursor-pointer appearance-none"
                    >
                      {businesses.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.brand_name || "Unnamed Enterprise"} ({b.category || "General"})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l pl-3 border-slate-200">
                      <Building2 className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Campaign Type selection */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-blue-950 uppercase tracking-wider block">
                    Choose Campaign Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() => setCampaignType("search_boost")}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-36 ${
                        campaignType === "search_boost"
                          ? "border-blue-950 bg-blue-50/20 ring-4 ring-blue-50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">Search Visibility Boost</span>
                          <TrendingUp className="w-4 h-4 text-blue-900" />
                        </div>
                        <p className="text-[11px] text-slate-500 font-light mt-2 leading-relaxed">
                          Boost your listing's ranking in search results using custom multiplier weights (1.2x to 3.0x).
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Search Boost
                        </span>
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          campaignType === "search_boost" ? "border-blue-950 bg-blue-950" : "border-slate-300"
                        }`}>
                          {campaignType === "search_boost" && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => setCampaignType("homepage_patron")}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-36 ${
                        campaignType === "homepage_patron"
                          ? "border-blue-950 bg-rose-50/10 ring-4 ring-rose-50/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">Homepage Patron Spotlight</span>
                          <Sparkles className="w-4 h-4 text-red-600" />
                        </div>
                        <p className="text-[11px] text-slate-500 font-light mt-2 leading-relaxed">
                          Showcase your brand logo on the SWIR Directory homepage with a direct link to your website.
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Landing Page Grid
                        </span>
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          campaignType === "homepage_patron" ? "border-blue-950 bg-blue-950" : "border-slate-300"
                        }`}>
                          {campaignType === "homepage_patron" && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Boost selection grid - conditionally rendered */}
                {campaignType === "search_boost" ? (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-blue-950 uppercase tracking-wider block">
                      Choose Boost Multiplier Tier
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {BOOST_TIERS.map((tier) => {
                        const isSelected = selectedBoost === tier.multiplier;
                        return (
                          <div
                            key={tier.name}
                            onClick={() => setSelectedBoost(tier.multiplier)}
                            className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-40 ${
                              isSelected
                                ? `border-blue-950 ${tier.bgColor} ring-4 ring-blue-50`
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            {tier.recommended && (
                              <span className="absolute -top-2.5 right-4 bg-red-600 text-white text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full">
                                Popular
                              </span>
                            )}
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-sm">{tier.name}</span>
                                <span
                                  className={`text-xl font-black ${
                                    isSelected ? "text-blue-950" : tier.textColor
                                  }`}
                                >
                                  {tier.multiplier.toFixed(1)}x
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-light mt-2 leading-relaxed">
                                {tier.description}
                              </p>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                Multiplier Weight
                              </span>
                              <div className="flex items-center gap-1.5">
                                <div
                                  className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                                    isSelected
                                      ? "border-blue-950 bg-blue-950"
                                      : "border-slate-300"
                                  }`}
                                >
                                  {isSelected && (
                                    <div className="w-1 h-1 bg-white rounded-full"></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Warning/Instruction if configuration is incomplete */
                  <div className="space-y-4">
                    {!hasLogoAndWebsite ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3 text-amber-800">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                        <div className="space-y-1">
                          <h4 className="font-bold text-xs uppercase tracking-wider block">Configuration Incomplete</h4>
                          <p className="text-[11px] font-light leading-relaxed">
                            To request a Homepage Patron campaign, this business listing must have both a **Brand Logo** and a **Website URL** configured in the directory.
                          </p>
                          <ul className="list-disc list-inside text-[11px] font-medium mt-1 space-y-0.5">
                            {!selectedBusiness?.logo_url && <li className="text-amber-700">Missing Business Logo</li>}
                            {!selectedBusiness?.website_url && <li className="text-amber-700">Missing Website Link</li>}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex gap-3 text-emerald-800">
                        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                        <div className="space-y-1">
                          <h4 className="font-bold text-xs uppercase tracking-wider block">Ready for Placement</h4>
                          <p className="text-[11px] font-light leading-relaxed">
                            Listing has logo image and website URL configured. The logo will link to <a href={selectedBusiness.website_url || undefined} target="_blank" rel="noopener noreferrer" className="underline font-bold text-emerald-700">{selectedBusiness.website_url}</a> once activated.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Campaign Date Ranges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-950 uppercase tracking-wider block">
                      Campaign Start Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={startDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-800 text-xs font-semibold"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-950 uppercase tracking-wider block">
                      Campaign End Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-800 text-xs font-semibold"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="submit"
                  disabled={isSubmitting || (campaignType === "homepage_patron" && !hasLogoAndWebsite)}
                  className="w-full py-3.5 bg-blue-950 hover:bg-black text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs active:scale-95 cursor-pointer mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Sponsorship Request...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Submit Campaign Request</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Quick info panel (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-blue-950 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
              <HelpCircle className="w-4 h-4 text-red-600" />
              <span>How Search Boost Works</span>
            </h3>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs border border-blue-100 shadow-sm">
                  1
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-800 text-xs leading-none">Select Enterprise</h4>
                  <p className="text-[10px] text-slate-500 font-light leading-relaxed mt-1">
                    Pick which directory merchant listing you want to target for enhanced search visibility.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs border border-amber-100 shadow-sm">
                  2
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-800 text-xs leading-none">Set Boost Multiplier</h4>
                  <p className="text-[10px] text-slate-500 font-light leading-relaxed mt-1">
                    Set a boost tier (1.2x to 3.0x). This multiplier directly inflates your RRF (Reciprocal Rank Fusion) database algorithm score on all queries.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs border border-emerald-100 shadow-sm">
                  3
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-800 text-xs leading-none">Admin Approval Queue</h4>
                  <p className="text-[10px] text-slate-500 font-light leading-relaxed mt-1">
                    Submissions are entered in `pending` review. SWIR region or super admins audit and activate it instantly to initiate boosts!
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-red-800 text-[10px] uppercase tracking-wider block">Ad Policies</h4>
                <p className="text-[10px] text-red-800/80 leading-normal font-light">
                  Active boosts require a valid membership status. Boost rankings expire automatically at midnight of the chosen campaign expiration date.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns Listing Section */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
        <h3 className="text-xl font-black text-blue-950 uppercase tracking-tight flex items-center gap-2.5 border-b border-slate-100 pb-4">
          <TrendingUp className="w-5 h-5 text-red-600" />
          <span>My Promotion History</span>
        </h3>

        {campaigns.length === 0 ? (
          <div className="bg-slate-50/50 rounded-2xl p-16 text-center border border-dashed border-slate-200">
            <Percent className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 mb-1">No Promotions Configured</h4>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              Configure and submit your first search visibility boost using the layout form above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-4 px-4">Business Listing</th>
                  <th className="py-4 px-4">Sponsorship Tier</th>
                  <th className="py-4 px-4">Boost Power</th>
                  <th className="py-4 px-4">Duration</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {campaigns.map((camp) => {
                  const isPendingOrActive =
                    camp.status === "pending" || camp.status === "active";
                  const startFormatted = new Date(
                    camp.start_date
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const endFormatted = new Date(
                    camp.end_date
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr key={camp.id} className="text-sm font-semibold group">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                            {camp.businesses?.logo_url ? (
                              <img
                                src={camp.businesses.logo_url}
                                alt="Logo"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Building2 className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                          <div>
                            <p className="text-slate-900 font-bold leading-none">
                              {camp.businesses?.brand_name || "Unnamed Listing"}
                            </p>
                            <span className="text-[10px] font-bold text-slate-400 block mt-1 uppercase tracking-wider">
                              {camp.businesses?.category || "Professional"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-500 font-light">
                        {camp.campaign_type === "homepage_patron" ? (
                          <span className="text-red-700 font-bold bg-red-50/50 px-2 py-0.5 rounded border border-red-100 text-[10px] uppercase tracking-wide">
                            Patron Spotlight
                          </span>
                        ) : camp.boost_multiplier >= 3.0 ? (
                          <span className="text-blue-900 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-[10px] uppercase">
                            Platinum Tier
                          </span>
                        ) : camp.boost_multiplier >= 2.0 ? (
                          <span className="text-yellow-700 font-bold bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100 text-[10px] uppercase">
                            Gold Tier
                          </span>
                        ) : camp.boost_multiplier >= 1.5 ? (
                          <span className="text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[10px] uppercase">
                            Silver Tier
                          </span>
                        ) : (
                          <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 text-[10px] uppercase">
                            Bronze Tier
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-black text-blue-950">
                        {camp.campaign_type === "homepage_patron" ? (
                          <span className="text-slate-400 font-light text-xs">—</span>
                        ) : (
                          `${camp.boost_multiplier.toFixed(1)}x`
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-500 font-light text-xs">
                        <span>{startFormatted}</span>
                        <span className="mx-2 text-slate-400">—</span>
                        <span>{endFormatted}</span>
                      </td>
                      <td className="py-4 px-4">{getStatusBadge(camp.status)}</td>
                      <td className="py-4 px-4 text-right">
                        {isPendingOrActive ? (
                          <button
                            onClick={() => handlePause(camp.id)}
                            disabled={actionLoadingId === camp.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 border border-transparent rounded-lg text-xs font-bold text-slate-600 transition-all cursor-pointer disabled:opacity-50"
                            title="Pause boost campaign"
                          >
                            {actionLoadingId === camp.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Pause className="w-3 h-3" />
                            )}
                            <span>Pause</span>
                          </button>
                        ) : camp.status === "paused" ? (
                          <span className="text-[10px] text-slate-400 font-medium italic block">
                            Contact Admin to Resume
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium italic block">
                            Expired
                          </span>
                        )}
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
