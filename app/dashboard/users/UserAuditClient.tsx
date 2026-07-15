"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Calendar, 
  ExternalLink,
  Briefcase,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface ProfileItem {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string;
  phone: string | null;
  club: string | null;
  app_role: string;
  created_at: string;
}

interface BusinessLink {
  id: string;
  brand_name: string | null;
  owner_id: string | null;
  owner_profile_id: string | null;
}

interface UserAuditClientProps {
  profiles: ProfileItem[];
  businesses: BusinessLink[];
}

export default function UserAuditClient({
  profiles,
  businesses
}: UserAuditClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<ProfileItem | null>(null);

  // Search filter matching name or email
  const filteredProfiles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return profiles;
    return profiles.filter(p => 
      (p.full_name || "").toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    );
  }, [profiles, searchQuery]);

  // Find businesses owned by the selected profile
  const selectedProfileBusinesses = useMemo(() => {
    if (!selectedProfile) return [];
    return businesses.filter(b => 
      b.owner_profile_id === selectedProfile.id || 
      b.owner_id === selectedProfile.user_id
    );
  }, [selectedProfile, businesses]);

  return (
    <div className="space-y-6">
      
      {/* Search Header panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-grow max-w-md group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search members by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all text-sm text-slate-900"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">
          Showing {filteredProfiles.length} of {profiles.length} Members
        </div>
      </div>

      {/* Main Table view */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredProfiles.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-sm font-light">
            No member accounts found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider bg-slate-50/50">
                  <th className="py-4 px-6">Member Name</th>
                  <th className="py-4 px-6">Role Tier</th>
                  <th className="py-4 px-6">Club Affiliation</th>
                  <th className="py-4 px-6">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProfiles.map((p) => {
                  const joinedFormatted = new Date(p.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => setSelectedProfile(p)}
                      className="text-sm font-semibold text-slate-700 hover:bg-slate-50/70 transition-all cursor-pointer group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-900 to-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 group-hover:scale-105 transition-transform">
                            {(p.full_name || "?").charAt(0)}
                          </div>
                          <div>
                            <p className="text-slate-900 font-bold leading-none group-hover:text-blue-600 transition-colors">
                              {p.full_name || "Nexus User"}
                            </p>
                            <span className="text-[10px] font-medium text-slate-400 block mt-1 leading-none">
                              {p.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                          p.app_role === "super_admin" 
                            ? "bg-red-50 text-red-700 border-red-100" 
                            : p.app_role === "review_admin"
                              ? "bg-purple-50 text-purple-700 border-purple-100"
                              : p.app_role === "business_owner"
                                ? "bg-blue-50 text-blue-700 border-blue-100"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {p.app_role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-light">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{p.club || "Unspecified Club"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-light text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          <span>{joinedFormatted}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CRM Detail Slide-out Drawer / Modal Overlay */}
      <AnimatePresence>
        {selectedProfile && (
          <>
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProfile(null)}
              className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
            />

            {/* Slide-out Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 border-l border-slate-100 flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-950 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-blue-950 text-lg uppercase tracking-tight">CRM Profile File</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                      SWIR Member Directory
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedProfile(null)}
                  className="p-2 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-grow p-8 overflow-y-auto space-y-8">
                
                {/* Meta Summary Profile Avatar */}
                <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-slate-100">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-900 to-slate-900 text-white flex items-center justify-center font-black text-3xl uppercase shadow-md shadow-blue-950/15">
                    {(selectedProfile.full_name || "?").charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-blue-950 leading-tight">
                      {selectedProfile.full_name || "Nexus User"}
                    </h2>
                    <span className="text-xs text-slate-400 font-medium block mt-1">
                      Registered ID: <span className="font-mono text-[10px]">{selectedProfile.id}</span>
                    </span>
                  </div>
                </div>

                {/* Profile Details Matrix */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Details</h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center p-3 bg-slate-50 border border-slate-200/40 rounded-2xl gap-3">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Email Address</p>
                        <p className="text-sm font-semibold text-slate-800 mt-1 truncate">{selectedProfile.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center p-3 bg-slate-50 border border-slate-200/40 rounded-2xl gap-3">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Contact Phone</p>
                        <p className="text-sm font-semibold text-slate-800 mt-1">{selectedProfile.phone || "No phone added"}</p>
                      </div>
                    </div>

                    <div className="flex items-center p-3 bg-slate-50 border border-slate-200/40 rounded-2xl gap-3">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Club Affiliation</p>
                        <p className="text-sm font-semibold text-slate-800 mt-1">{selectedProfile.club || "Unassigned"}</p>
                      </div>
                    </div>

                    <div className="flex items-center p-3 bg-slate-50 border border-slate-200/40 rounded-2xl gap-3">
                      <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Authorization Role</p>
                        <p className="text-sm font-semibold text-slate-800 mt-1 uppercase tracking-wider">{selectedProfile.app_role.replace("_", " ")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Linked Business Directory Profiles */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Associated Business Listings</h4>
                  
                  {selectedProfileBusinesses.length === 0 ? (
                    <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-2xl text-center text-xs text-slate-400 italic">
                      No businesses registered under this member&apos;s credentials.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedProfileBusinesses.map(b => (
                        <div 
                          key={b.id}
                          className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/60 rounded-2xl hover:border-slate-300 hover:bg-slate-100/30 transition-all group/biz"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                              <Briefcase className="w-4 h-4 text-red-500" />
                            </div>
                            <span className="font-bold text-sm text-slate-800 truncate leading-none">
                              {b.brand_name || "Unnamed Enterprise"}
                            </span>
                          </div>
                          <Link
                            href={`/directory/${b.id}`}
                            target="_blank"
                            className="inline-flex items-center justify-center w-8 h-8 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shrink-0 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50/50">
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="px-6 py-2.5 bg-blue-950 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                >
                  Close Profile File
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
