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
  ArrowRight,
  Compass,
  Activity,
  BarChart3,
  CheckCircle2
} from "lucide-react";

interface SystemActivity {
  type: "ad" | "auth" | "business" | "member";
  desc: string;
  time: string;
  status: string;
}

interface CategoryCount {
  category: string;
  count: number;
}

interface CampaignStatusCount {
  status: string;
  count: number;
}

interface AdminViewProps {
  profile: Profile;
  memberCount: number;
  businessCount: number;
  activeCampaignsCount: number;
  recentActivities: SystemActivity[];
  categoryStats: CategoryCount[];
  campaignStats: CampaignStatusCount[];
}

export default function AdminView({ 
  profile, 
  memberCount, 
  businessCount, 
  activeCampaignsCount,
  recentActivities,
  categoryStats,
  campaignStats
}: AdminViewProps) {

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "auth":
        return <Users className="w-4 h-4 text-blue-600" />;
      case "ad":
        return <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />;
      case "business":
        return <Briefcase className="w-4 h-4 text-emerald-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
      case "active":
        return "bg-green-500";
      case "pending":
        return "bg-amber-500";
      case "paused":
        return "bg-slate-400";
      case "expired":
        return "bg-rose-500";
      default:
        return "bg-purple-500";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Upper Navigation Header */}
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
            href="/dashboard?view=owner"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-blue-950 hover:bg-black text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-blue-950/20 text-xs active:scale-95 cursor-pointer"
          >
            <Briefcase className="w-4 h-4 text-red-500" />
            <span>View My Business Profile</span>
          </Link>
        </div>
      </div>

      {/* Directory Metrics Counters Grid (Clickable to audit lists) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <Link 
          href="/dashboard/users"
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Registered Members</p>
              <p className="text-3xl font-black text-blue-950 mt-1.5 leading-none">{memberCount}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link 
          href="/dashboard/businesses"
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 border border-red-100 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Listed Enterprises</p>
              <p className="text-3xl font-black text-blue-950 mt-1.5 leading-none">{businessCount}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link 
          href="/dashboard/campaigns"
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Active Boost Ads</p>
              <p className="text-3xl font-black text-blue-950 mt-1.5 leading-none">{activeCampaignsCount}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activities Log Panel (2/3 width) - LIVE DATA */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-blue-950 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
            <TrendingUp className="w-4 h-4 text-red-600" />
            <span>Real-time System Actions</span>
          </h3>

          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No recent system activities found.</p>
              </div>
            ) : (
              recentActivities.map((log, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-200 hover:bg-slate-100/30 transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                      {getActivityIcon(log.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate leading-relaxed">{log.desc}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{log.type}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <div className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(log.status)}`}></span>
                          <span className="text-[9px] font-semibold text-slate-500 uppercase">{log.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-light shrink-0 ml-4">{log.time}</span>
                </div>
              ))
            )}
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
                <p className="text-xs text-red-800 leading-relaxed font-light">
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

      {/* Visual Analytics Chart View Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Category distribution bar list (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-blue-950 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
            <BarChart3 className="w-4 h-4 text-red-600" />
            <span>Category Density distribution</span>
          </h3>

          <div className="space-y-4 pt-2">
            {categoryStats.length === 0 ? (
              <p className="text-slate-400 text-xs italic">No listings recorded to calculate densities.</p>
            ) : (
              categoryStats.map((item) => {
                const maxCount = Math.max(...categoryStats.map(s => s.count)) || 1;
                const percentage = Math.round((item.count / maxCount) * 100);
                const totalPercent = Math.round((item.count / (businessCount || 1)) * 100);

                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{item.category}</span>
                      <span className="text-slate-400 font-light">{item.count} listing{item.count !== 1 ? "s" : ""} ({totalPercent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-blue-950 h-2.5 rounded-full transition-all duration-700 ease-out shadow-sm"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ad campaign distribution chart list (1/3 width) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-blue-950 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-red-600" />
              <span>Campaign Status Breakdown</span>
            </h3>

            <div className="space-y-4 pt-4">
              {campaignStats.length === 0 ? (
                <p className="text-slate-400 text-xs italic">No promotion campaigns running.</p>
              ) : (
                campaignStats.map((item) => {
                  const total = campaignStats.reduce((sum, s) => sum + s.count, 0) || 1;
                  const percent = Math.round((item.count / total) * 100);

                  return (
                    <div key={item.status} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all">
                      <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`}></span>
                        <span className="text-xs font-bold text-slate-700 capitalize">{item.status}</span>
                      </div>
                      <span className="text-xs font-black text-blue-950">
                        {item.count} <span className="text-[10px] text-slate-400 font-light ml-0.5">({percent}%)</span>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center mt-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Promotion Requests</p>
            <p className="text-3xl font-black text-blue-950 mt-2 leading-none">
              {campaignStats.reduce((sum, item) => sum + item.count, 0)}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
