"use client";

import React from "react";
import Link from "next/link";
import { Business, Profile } from "@/types/database.types";
import { 
  Briefcase, 
  Plus, 
  Image as ImageIcon, 
  Settings, 
  ExternalLink,
  Eye,
  Share2,
  TrendingUp,
  ShieldCheck,
  Compass,
  ArrowRight
} from "lucide-react";

interface AnalyticsEventSummary {
  business_id: string;
  event_type: "view" | "referral";
}

interface BusinessOwnerViewProps {
  profile: Profile;
  businesses: Business[];
  analyticsEvents: AnalyticsEventSummary[];
}

export default function BusinessOwnerView({ profile, businesses, analyticsEvents }: BusinessOwnerViewProps) {
  // Compute global summary counts for this owner's portfolio
  const totalViews = analyticsEvents.filter(e => e.event_type === "view").length;
  const totalReferrals = analyticsEvents.filter(e => e.event_type === "referral").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Return Banner for Impersonating Super Admins */}
      {profile.app_role === "super_admin" && (
        <div className="sticky top-4 z-50 bg-blue-950 text-white rounded-3xl p-5 border border-red-500/20 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Admin Control Impersonation</p>
              <p className="text-xs font-light text-slate-300">Currently viewing the Partner Console as a Business Owner.</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 shrink-0 text-center"
          >
            Return to Admin Console
          </Link>
        </div>
      )}
      
      {/* Upper Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full uppercase tracking-widest block w-fit">
            Business Owner
          </div>
          <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-tight mt-2">
            Business Partner Dashboard
          </h1>
          <p className="text-slate-500 font-light text-base">
            Manage your merchant portfolio, view dynamic traffic analytics, and boost search promotions.
          </p>
        </div>

        <Link 
          href="/dashboard/onboarding"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-950 hover:bg-black text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-900/10 shrink-0 text-sm active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Business</span>
        </Link>
      </div>

      {/* Global Performance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Total Views</p>
            <p className="text-2xl font-black text-blue-950 mt-1 leading-none">{totalViews}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Total Referrals</p>
            <p className="text-2xl font-black text-blue-950 mt-1 leading-none">{totalReferrals}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Total Listings</p>
            <p className="text-2xl font-black text-blue-950 mt-1 leading-none">{businesses.length}</p>
          </div>
        </div>
      </div>

      {/* Portfolio Directory Sections */}
      <div className="space-y-6">
        <h3 className="text-lg font-black text-blue-950 uppercase tracking-tight flex items-center gap-2 border-b border-slate-200 pb-3">
          <Briefcase className="w-5 h-5 text-red-600" />
          <span>My Registered Listings</span>
        </h3>

        {businesses.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-2">No Active Listings</h4>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
              You don't have any businesses linked to your profile. Set up your brand listing now.
            </p>
            <Link 
              href="/dashboard/onboarding"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-950 text-white rounded-xl font-bold hover:bg-black transition-all text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Listing</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {businesses.map((biz) => {
              // Filter view/referral analytics for this specific business ID
              const bizViews = analyticsEvents.filter(e => e.business_id === biz.id && e.event_type === "view").length;
              const bizReferrals = analyticsEvents.filter(e => e.business_id === biz.id && e.event_type === "referral").length;

              return (
                <div key={biz.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
                  
                  {/* Card Details */}
                  <div className="p-6 flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center overflow-hidden shrink-0">
                        {biz.logo_url ? (
                          <img src={biz.logo_url} alt={biz.brand_name || 'Logo'} className="w-full h-full object-contain" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <span className="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded-lg border border-red-100/50 uppercase tracking-wider">
                        {biz.category || 'Professional'}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {biz.brand_name || 'Unnamed Enterprise'}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-light">
                        {biz.description || 'No description entered.'}
                      </p>
                    </div>

                    {/* Stats Grid inside Card */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Views</p>
                        <p className="text-lg font-black text-blue-950 mt-1.5 leading-none">{bizViews}</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Referrals</p>
                        <p className="text-lg font-black text-blue-950 mt-1.5 leading-none">{bizReferrals}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <Link 
                      href={`/dashboard/business/${biz.id}/edit`}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </Link>
                    <Link 
                      href={`/directory/${biz.id}`}
                      className="inline-flex items-center justify-center w-9 h-9 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shrink-0 cursor-pointer"
                      title="View Live Profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic Promotion Advertising Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        <div className="relative max-w-2xl space-y-4">
          <h2 className="text-2xl font-black tracking-tight leading-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-red-500" />
            <span>Launch a Sponsorship Campaign</span>
          </h2>
          <p className="text-blue-100/70 font-light text-sm leading-relaxed">
            Floating your listings to the top of search result sets is now simpler than ever. Launch a boost campaign and automatically multiply your RRF search weight score to float sponsored listings straight to the top of category queries!
          </p>
          <div className="pt-2">
            <Link 
              href="/dashboard/promotions"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-950 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-md group/btn text-xs active:scale-95"
            >
              <span>Explore Boost Promos</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
