"use client";

import React, { useState, useMemo } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from "recharts";
import { motion } from "framer-motion";
import { 
  Users, 
  Building2, 
  Sparkles, 
  TrendingUp, 
  Download, 
  Filter, 
  Globe 
} from "lucide-react";

interface BusinessItem {
  id: string;
  brand_name: string | null;
  category: string | null;
  city: string | null;
  ym_region: string | null;
}

interface CampaignItem {
  id: string;
  business_id: string;
  status: string;
  boost_multiplier: number;
  created_at: string;
}

interface EventItem {
  id: string;
  event_type: string;
  business_id: string;
  created_at: string;
}

interface AnalyticsClientProps {
  initialMembersCount: number;
  businesses: BusinessItem[];
  campaigns: CampaignItem[];
  events: EventItem[];
}

const COLORS = [
  "#1e3a8a", // blue-900
  "#dc2626", // red-600
  "#0d9488", // teal-600
  "#ca8a04", // yellow-600
  "#4f46e5", // indigo-600
  "#2563eb", // blue-600
  "#db2777", // pink-600
  "#16a34a"  // green-600
];

export default function AnalyticsClient({
  initialMembersCount,
  businesses,
  campaigns,
  events
}: AnalyticsClientProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Extract unique filter choices
  const regions = useMemo(() => {
    const set = new Set(businesses.map(b => b.ym_region).filter(Boolean) as string[]);
    return ["All", ...Array.from(set).sort()];
  }, [businesses]);

  const categories = useMemo(() => {
    const set = new Set(businesses.map(b => b.category).filter(Boolean) as string[]);
    return ["All", ...Array.from(set).sort()];
  }, [businesses]);

  // Compute filtered dataset
  const filteredBusinesses = useMemo(() => {
    return businesses.filter(b => {
      const matchRegion = selectedRegion === "All" || b.ym_region === selectedRegion;
      const matchCategory = selectedCategory === "All" || b.category === selectedCategory;
      return matchRegion && matchCategory;
    });
  }, [businesses, selectedRegion, selectedCategory]);

  const filteredBizIds = useMemo(() => {
    return new Set(filteredBusinesses.map(b => b.id));
  }, [filteredBusinesses]);

  // Filtered stats counters
  const activeBoostsCount = useMemo(() => {
    return campaigns.filter(c => c.status === "active" && filteredBizIds.has(c.business_id)).length;
  }, [campaigns, filteredBizIds]);

  const totalViews = useMemo(() => {
    return events.filter(e => e.event_type === "view" && filteredBizIds.has(e.business_id)).length;
  }, [events, filteredBizIds]);

  const totalReferrals = useMemo(() => {
    return events.filter(e => e.event_type === "referral" && filteredBizIds.has(e.business_id)).length;
  }, [events, filteredBizIds]);

  // Pie Chart Data: Businesses grouped by category
  const pieChartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredBusinesses.forEach(b => {
      const cat = b.category || "Other";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories
  }, [filteredBusinesses]);

  // Area Chart Data: Timeline of referrals and campaigns
  const areaChartData = useMemo(() => {
    const dayMap: { [key: string]: { date: string; referrals: number; campaigns: number } } = {};
    
    // Populate last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dateKey = d.toISOString().split("T")[0];
      dayMap[dateKey] = { date: dateString, referrals: 0, campaigns: 0 };
    }
    
    // Accumulate events
    events.forEach(e => {
      if (e.event_type === "referral" && filteredBizIds.has(e.business_id) && e.created_at) {
        const dateKey = e.created_at.split("T")[0];
        if (dayMap[dateKey]) {
          dayMap[dateKey].referrals += 1;
        }
      }
    });

    // Accumulate campaigns
    campaigns.forEach(c => {
      if (filteredBizIds.has(c.business_id) && c.created_at) {
        const dateKey = c.created_at.split("T")[0];
        if (dayMap[dateKey]) {
          dayMap[dateKey].campaigns += 1;
        }
      }
    });

    return Object.values(dayMap);
  }, [events, campaigns, filteredBizIds]);

  // Client-Side CSV Export Trigger
  const handleExportCSV = () => {
    const headers = ["Business ID", "Brand Name", "Category", "City", "Region", "Views", "Referrals"];
    const rows = filteredBusinesses.map(b => {
      const viewsCount = events.filter(e => e.business_id === b.id && e.event_type === "view").length;
      const referralsCount = events.filter(e => e.business_id === b.id && e.event_type === "referral").length;
      return [
        b.id,
        `"${(b.brand_name || "Unnamed").replace(/"/g, '""')}"`,
        `"${(b.category || "Other").replace(/"/g, '""')}"`,
        `"${(b.city || "Unknown").replace(/"/g, '""')}"`,
        `"${(b.ym_region || "Unassigned").replace(/"/g, '""')}"`,
        viewsCount,
        referralsCount
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ysmen_swir_analytics_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10">
      
      {/* Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Total Members</p>
            <p className="text-2xl font-black text-blue-950 mt-1.5 leading-none">{initialMembersCount}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Matched Listings</p>
            <p className="text-2xl font-black text-blue-950 mt-1.5 leading-none">{filteredBusinesses.length}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Active Boosts</p>
            <p className="text-2xl font-black text-blue-950 mt-1.5 leading-none">{activeBoostsCount}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 border border-red-100 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Traffic Clicks</p>
            <p className="text-2xl font-black text-blue-950 mt-1.5 leading-none">{totalViews + totalReferrals}</p>
          </div>
        </motion.div>
      </div>

      {/* Control Panel (Filters & Download Trigger) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-red-600" />
            <span>Interactive Filters:</span>
          </div>

          {/* Region Filter */}
          <div className="relative group">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer appearance-none hover:bg-slate-100 hover:border-slate-300 transition-all"
            >
              <option value="All">All Regions</option>
              {regions.filter(r => r !== "All").map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative group">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer appearance-none hover:bg-slate-100 hover:border-slate-300 transition-all"
            >
              <option value="All">All Categories</option>
              {categories.filter(c => c !== "All").map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-red-600/10 cursor-pointer active:scale-95 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download CSV Report</span>
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Gradient Area Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[400px]"
        >
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-base font-black text-blue-950 uppercase tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-500" />
              <span>Sponsorships & Referrals Timeline (7 Days)</span>
            </h3>
          </div>
          
          <div className="flex-1 w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReferrals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCampaigns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", borderRadius: "16px", border: "none" }}
                  labelStyle={{ color: "#f8fafc", fontWeight: "bold", fontSize: "11px" }}
                  itemStyle={{ fontSize: "11px", padding: "2px 0" }}
                />
                <Area type="monotone" dataKey="referrals" name="Referrals" stroke="#1e3a8a" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReferrals)" />
                <Area type="monotone" dataKey="campaigns" name="Ad Campaigns" stroke="#dc2626" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCampaigns)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Donut/Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[400px]"
        >
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-base font-black text-blue-950 uppercase tracking-tight flex items-center gap-2">
              <Building2 className="w-4 h-4 text-red-500" />
              <span>Businesses by Category</span>
            </h3>
          </div>

          <div className="flex-1 w-full h-[300px] flex flex-col sm:flex-row items-center justify-around gap-4">
            {pieChartData.length === 0 ? (
              <p className="text-slate-400 text-xs italic">No matching business listings found.</p>
            ) : (
              <>
                <div className="w-[180px] h-[180px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1e293b", borderRadius: "12px", border: "none", color: "#fff" }}
                        itemStyle={{ fontSize: "11px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-col gap-2 min-w-[150px] max-h-[220px] overflow-y-auto pr-2">
                  {pieChartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></span>
                      <span className="text-[10px] font-bold text-slate-600 truncate max-w-[120px] uppercase">
                        {entry.name}: {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
