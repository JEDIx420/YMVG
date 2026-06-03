"use client";

import React, { useMemo } from "react";
import { BarChart3, Award, Users, Share2, TrendingUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

interface OwnerAnalyticsClientProps {
  businesses: { id: string; brand_name: string }[];
  events: any[];
}

export default function OwnerAnalyticsClient({ businesses, events }: OwnerAnalyticsClientProps) {
  // Aggregate stats
  const totalViews = useMemo(() => events.filter(e => e.event_type === "view").length, [events]);
  const totalReferrals = useMemo(() => events.filter(e => e.event_type === "referral").length, [events]);

  // Leaderboard logic: group referrals by referrer profile
  const leaderboard = useMemo(() => {
    const referrals = events.filter(e => e.event_type === "referral" && e.profiles);
    const referrerMap: { [id: string]: { name: string; email: string; club: string; count: number } } = {};
    
    referrals.forEach(e => {
      const prof = e.profiles;
      if (prof) {
        if (!referrerMap[prof.id]) {
          referrerMap[prof.id] = {
            name: prof.full_name || "Unknown Member",
            email: prof.email,
            club: prof.club || "No Club",
            count: 0
          };
        }
        referrerMap[prof.id].count += 1;
      }
    });

    return Object.values(referrerMap).sort((a, b) => b.count - a.count);
  }, [events]);

  // Timeline chart data (last 7 days)
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();

    return last7Days.map(date => {
      const views = events.filter(e => e.event_type === "view" && e.created_at.startsWith(date)).length;
      const referrals = events.filter(e => e.event_type === "referral" && e.created_at.startsWith(date)).length;
      const formattedDate = new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      return {
        date: formattedDate,
        Views: views,
        Referrals: referrals
      };
    });
  }, [events]);

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none">Showcase Views</p>
            <p className="text-3xl font-black text-blue-950 mt-2 leading-none">{totalViews}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 border border-red-100 shrink-0">
            <Share2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none">Member Referrals</p>
            <p className="text-3xl font-black text-blue-950 mt-2 leading-none">{totalReferrals}</p>
          </div>
        </div>
      </div>

      {/* Traffic Chart */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        <h3 className="text-lg font-black text-blue-950 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
          <BarChart3 className="w-4 h-4 text-red-600" />
          <span>7-Day Attribution Performance</span>
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorReferrals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#ffffff", 
                  border: "1px solid #e2e8f0", 
                  borderRadius: "12px", 
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#0f172a" 
                }} 
              />
              <Area type="monotone" dataKey="Views" stroke="#1e3a8a" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
              <Area type="monotone" dataKey="Referrals" stroke="#dc2626" strokeWidth={2} fillOpacity={1} fill="url(#colorReferrals)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        <h3 className="text-lg font-black text-blue-950 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
          <Award className="w-4 h-4 text-red-600" />
          <span>Top Referrers Leaderboard</span>
        </h3>

        {leaderboard.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No member referrals registered for your business yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3 px-4">Referrer</th>
                  <th className="py-3 px-4">Y's Men Club</th>
                  <th className="py-3 px-4 text-right">Clicks Driven</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leaderboard.map((ref, idx) => (
                  <tr key={idx} className="text-sm font-semibold text-slate-700 hover:bg-slate-50/50 transition-all">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-slate-900 font-bold leading-none">{ref.name}</p>
                          <span className="text-[10px] font-medium text-slate-400 block mt-1 leading-none">{ref.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-light">
                      {ref.club}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100/50">
                        {ref.count} referral{ref.count !== 1 ? "s" : ""}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
