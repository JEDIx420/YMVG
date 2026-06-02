"use client";

import React from "react";
import Link from "next/link";
import { Profile } from "@/types/database.types";
import { 
  Users, 
  Briefcase, 
  Sparkles, 
  MapPin, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle,
  Plus,
  ArrowRight,
  Compass
} from "lucide-react";

interface AdminViewProps {
  profile: Profile;
  memberCount: number;
  businessCount: number;
  activeCampaignsCount: number;
}

export default function AdminView({ 
  profile, 
  memberCount, 
  businessCount, 
  activeCampaignsCount 
}: AdminViewProps) {

  // Mock list of recent system logs/events to make the admin command panel feel alive
  const recentLogs = [
    { type: "auth", desc: "New Google OAuth enrollment completed", time: "5 mins ago", status: "success" },
    { type: "search", desc: "NVIDIA NIM vector generated for member claim", time: "18 mins ago", status: "success" },
    { type: "ad", desc: "Draft campaign created for 'Eagle Eye Systems'", time: "1 hour ago", status: "pending" },
    { type: "sync", desc: "Auto-revalidation sitemap trigger successfully rebuilt", time: "3 hours ago", status: "success" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Dynamic Navigation Header */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full uppercase tracking-widest block w-fit">
            System Administrator
          </div>
          <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-tight mt-2">
            NEXUS Admin Console
          </h1>
          <p className="text-slate-500 font-light text-base">
            System-wide statistics monitoring, role audits, region configurations, and search ad management.
          </p>
        </div>

        <div className="flex gap-3 shrink-0">
          <Link 
            href="/dashboard/users"
            className="inline-flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all text-xs active:scale-95"
          >
            <Users className="w-4 h-4" />
            <span>Audit Members</span>
          </Link>
          <Link 
            href="/dashboard/campaigns"
            className="inline-flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-md shadow-red-600/10 text-xs active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Manage Ads</span>
          </Link>
        </div>
      </div>

      {/* Directory Metrics Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Registered Members</p>
              <p className="text-3xl font-black text-blue-950 mt-1.5 leading-none">{memberCount}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-all" />
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 border border-red-100 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Listed Enterprises</p>
              <p className="text-3xl font-black text-blue-950 mt-1.5 leading-none">{businessCount}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-red-600 transition-all" />
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Active Boost Ads</p>
              <p className="text-3xl font-black text-blue-950 mt-1.5 leading-none">{activeCampaignsCount}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activities Log Panel (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-blue-950 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
            <TrendingUp className="w-4 h-4 text-red-600" />
            <span>Real-time System Actions</span>
          </h3>

          <div className="space-y-4">
            {recentLogs.map((log, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    log.status === "success" ? "bg-green-500 animate-pulse" : "bg-amber-500 animate-pulse"
                  }`}></div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate leading-relaxed">{log.desc}</p>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">{log.type}</span>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-light shrink-0">{log.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Administration Guidelines / Tools (1/3 width) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-lg font-black text-blue-950 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-red-600" />
              <span>Admin Toolbox</span>
            </h3>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3 p-3 bg-red-50/50 border border-red-100 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 leading-relaxed">
                  As an administrator, all modifications you perform across business profiles directly update vector search indices in real time. Use caution when editing.
                </p>
              </div>

              <div className="space-y-2.5">
                <Link
                  href="/dashboard/regions"
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl hover:bg-slate-100 hover:border-slate-300 font-semibold text-xs text-slate-700 transition-all cursor-pointer"
                >
                  <span>Configure SWIR Regions</span>
                  <MapPin className="w-4 h-4 text-slate-400" />
                </Link>
                <Link
                  href="/directory"
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl hover:bg-slate-100 hover:border-slate-300 font-semibold text-xs text-slate-700 transition-all cursor-pointer"
                >
                  <span>View Public Marketplace</span>
                  <Compass className="w-4 h-4 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest border-t border-slate-100 pt-4">
            Security Definer Bypass Active
          </div>
        </div>

      </div>

    </div>
  );
}
