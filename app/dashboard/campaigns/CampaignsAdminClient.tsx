"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { approveCampaign, pauseCampaign } from "@/app/actions/adCampaigns";
import { Profile } from "@/types/database.types";
import {
  ShieldAlert,
  Sparkles,
  Check,
  X,
  Building2,
  Calendar,
  Phone,
  Mail,
  User,
  Clock,
  TrendingUp,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Percent,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Pause,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BusinessDetails {
  id: string;
  brand_name: string | null;
  category: string | null;
  logo_url: string | null;
  ym_region: string | null;
  city: string | null;
  owner_id: string | null;
  owner_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

interface CampaignItem {
  id: string;
  business_id: string;
  status: string;
  boost_multiplier: number;
  start_date: string;
  end_date: string;
  created_at: string;
  businesses: BusinessDetails | null;
}

interface OwnerProfileItem {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  club: string | null;
}

interface CampaignsAdminClientProps {
  profile: Profile;
  initialCampaigns: CampaignItem[];
  ownerProfiles: OwnerProfileItem[];
}

export default function CampaignsAdminClient({
  profile,
  initialCampaigns,
  ownerProfiles,
}: CampaignsAdminClientProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(initialCampaigns);
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "all">("pending");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Group and count campaigns
  const pendingCampaigns = campaigns.filter((c) => c.status === "pending");
  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const archivedCampaigns = campaigns.filter((c) => c.status !== "pending" && c.status !== "active");

  const resolveOwnerDetails = (ownerUserId: string | null) => {
    if (!ownerUserId) return null;
    return ownerProfiles.find((p) => p.id === ownerUserId) || null;
  };

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    setStatusMessage(null);

    try {
      const res = await approveCampaign(id);
      if (!res.success) {
        throw new Error(res.error || "Failed to approve campaign.");
      }

      setStatusMessage({
        type: "success",
        text: "Campaign activated successfully! Search weight RRF boost is now live.",
      });

      // Update local state status
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "active" } : c))
      );

      setTimeout(() => {
        router.refresh();
        setStatusMessage(null);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: "error",
        text: err.message || "Approval failed.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActionLoadingId(id);
    setStatusMessage(null);

    try {
      const res = await pauseCampaign(id);
      if (!res.success) {
        throw new Error(res.error || "Failed to decline campaign.");
      }

      setStatusMessage({
        type: "success",
        text: "Campaign set to paused state.",
      });

      // Update local state status
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "paused" } : c))
      );

      setTimeout(() => {
        router.refresh();
        setStatusMessage(null);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to decline campaign.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            Pending Review
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 uppercase tracking-wider">
            Paused
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 uppercase tracking-wider">
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-100 uppercase tracking-wider">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full uppercase tracking-widest block w-fit">
            Administration Control
          </div>
          <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-tight mt-2">
            Ad Campaigns Queue
          </h1>
          <p className="text-slate-500 font-light text-base">
            Review, approve, and manage search visibility boost sponsorship campaigns.
          </p>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div 
          onClick={() => setActiveTab("pending")}
          className={`bg-white rounded-3xl p-6 border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
            activeTab === "pending" ? "border-blue-950 ring-4 ring-blue-50" : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Pending Approval</p>
              <p className="text-2xl font-black text-blue-950 mt-1 leading-none">{pendingCampaigns.length}</p>
            </div>
          </div>
          <ArrowRight className={`w-4 h-4 text-slate-300 transition-all ${activeTab === "pending" ? "translate-x-1 text-blue-950" : ""}`} />
        </div>

        <div 
          onClick={() => setActiveTab("active")}
          className={`bg-white rounded-3xl p-6 border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
            activeTab === "active" ? "border-blue-950 ring-4 ring-blue-50" : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Active Boosts</p>
              <p className="text-2xl font-black text-blue-950 mt-1 leading-none">{activeCampaigns.length}</p>
            </div>
          </div>
          <ArrowRight className={`w-4 h-4 text-slate-300 transition-all ${activeTab === "active" ? "translate-x-1 text-blue-950" : ""}`} />
        </div>

        <div 
          onClick={() => setActiveTab("all")}
          className={`bg-white rounded-3xl p-6 border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
            activeTab === "all" ? "border-blue-950 ring-4 ring-blue-50" : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">All Campaigns</p>
              <p className="text-2xl font-black text-blue-950 mt-1 leading-none">{campaigns.length}</p>
            </div>
          </div>
          <ArrowRight className={`w-4 h-4 text-slate-300 transition-all ${activeTab === "all" ? "translate-x-1 text-blue-950" : ""}`} />
        </div>
      </div>

      {/* Dynamic Status messages */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 rounded-2xl flex items-center gap-3 border ${
              statusMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="font-semibold text-sm">{statusMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Tab View Rendering */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-xl font-black text-blue-950 uppercase tracking-tight flex items-center gap-2">
            {activeTab === "pending" && (
              <>
                <Clock className="w-5 h-5 text-amber-500" />
                <span>Pending Approvals Queue</span>
                <span className="ml-2 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-md border border-amber-200 leading-none">
                  {pendingCampaigns.length}
                </span>
              </>
            )}
            {activeTab === "active" && (
              <>
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <span>Active Directory Boosts</span>
                <span className="ml-2 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md border border-emerald-200 leading-none">
                  {activeCampaigns.length}
                </span>
              </>
            )}
            {activeTab === "all" && (
              <>
                <Building2 className="w-5 h-5 text-blue-950" />
                <span>Advertising Archive</span>
                <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-950 text-xs font-bold rounded-md border border-blue-200 leading-none">
                  {campaigns.length}
                </span>
              </>
            )}
          </h3>
        </div>

        {/* Campaign Lists */}
        {activeTab === "pending" && pendingCampaigns.length === 0 && (
          <div className="bg-slate-50/50 rounded-2xl p-16 text-center border border-dashed border-slate-200">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 mb-1">Queue is Empty</h4>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              There are no pending search visibility boost campaigns awaiting audit. All caught up!
            </p>
          </div>
        )}

        {activeTab === "active" && activeCampaigns.length === 0 && (
          <div className="bg-slate-50/50 rounded-2xl p-16 text-center border border-dashed border-slate-200">
            <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 mb-1">No Active Boosts</h4>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              There are currently no sponsored listings running search visibility boosts.
            </p>
          </div>
        )}

        {activeTab === "all" && campaigns.length === 0 && (
          <div className="bg-slate-50/50 rounded-2xl p-16 text-center border border-dashed border-slate-200">
            <Percent className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 mb-1">No Campaign History</h4>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              No promotions or advertising campaigns have been created in the system yet.
            </p>
          </div>
        )}

        {/* Display Listings */}
        {((activeTab === "pending" && pendingCampaigns.length > 0) ||
          (activeTab === "active" && activeCampaigns.length > 0) ||
          (activeTab === "all" && campaigns.length > 0)) && (
          <div className="space-y-6">
            {(activeTab === "pending"
              ? pendingCampaigns
              : activeTab === "active"
              ? activeCampaigns
              : campaigns
            ).map((camp) => {
              const startFormatted = new Date(camp.start_date).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" }
              );
              const endFormatted = new Date(camp.end_date).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" }
              );

              // Owner profile resolution
              const ownerProfile = resolveOwnerDetails(camp.businesses?.owner_id || null);

              return (
                <div
                  key={camp.id}
                  className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-md transition-all group"
                >
                  {/* Left Column: Business details & sponsorship power */}
                  <div className="space-y-4 max-w-xl">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        {camp.businesses?.logo_url ? (
                          <img
                            src={camp.businesses.logo_url}
                            alt="Logo"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-black text-slate-900 text-lg leading-tight">
                            {camp.businesses?.brand_name || "Unnamed Listing"}
                          </h4>
                          {getStatusBadge(camp.status)}
                        </div>
                        <p className="text-xs text-slate-500 font-medium block mt-1 uppercase tracking-wider flex items-center gap-1.5">
                          <span>{camp.businesses?.category || "Professional"}</span>
                          <span className="text-slate-300">•</span>
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {camp.businesses?.city || "Unknown City"} (
                            {camp.businesses?.ym_region || "Unknown Region"})
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Meta stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200/50">
                      <div className="bg-white rounded-2xl p-3 border border-slate-200/40 text-center shadow-inner-sm">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                          Boost Multiplier
                        </p>
                        <p className="text-xl font-black text-blue-950 mt-1 leading-none flex items-center justify-center gap-1">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                          <span>{camp.boost_multiplier.toFixed(1)}x</span>
                        </p>
                      </div>

                      <div className="bg-white rounded-2xl p-3 border border-slate-200/40 text-center shadow-inner-sm col-span-1 sm:col-span-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                          Active Duration
                        </p>
                        <p className="text-xs font-bold text-slate-700 mt-1.5 leading-none flex items-center justify-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{startFormatted}</span>
                          <span className="text-slate-300">—</span>
                          <span>{endFormatted}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Owner details */}
                  <div className="bg-white/80 border border-slate-200/40 rounded-2xl p-4 space-y-2 lg:max-w-xs w-full lg:w-fit">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Listing Owner & Contacts
                    </span>
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-800">
                          {ownerProfile?.full_name || camp.businesses?.owner_name || "Unknown Owner"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-light truncate">
                          {ownerProfile?.email || camp.businesses?.contact_email || "No Email"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-light">
                          {ownerProfile?.phone || camp.businesses?.contact_phone || "No Phone"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Approval/Decline buttons */}
                  <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0">
                    {camp.status === "pending" ? (
                      <>
                        <button
                          onClick={() => handleDecline(camp.id)}
                          disabled={actionLoadingId === camp.id}
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-4 h-4 text-red-600" />
                          <span>Decline</span>
                        </button>
                        <button
                          onClick={() => handleApprove(camp.id)}
                          disabled={actionLoadingId === camp.id}
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-950 text-white rounded-xl text-xs font-bold hover:bg-black transition-all cursor-pointer disabled:opacity-50"
                        >
                          {actionLoadingId === camp.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 text-emerald-400" />
                          )}
                          <span>Approve</span>
                        </button>
                      </>
                    ) : camp.status === "active" ? (
                      <button
                        onClick={() => handleDecline(camp.id)}
                        disabled={actionLoadingId === camp.id}
                        className="w-full lg:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:border-red-200 hover:text-red-600 hover:bg-red-50/20 rounded-xl text-xs font-bold text-slate-600 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {actionLoadingId === camp.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Pause className="w-3.5 h-3.5" />
                        )}
                        <span>Pause Boost</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium italic block w-full text-center lg:text-left">
                        Archive Record
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
