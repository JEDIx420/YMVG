"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/profiles";
import { Profile } from "@/types/database.types";
import { 
  User, 
  Phone, 
  MapPin, 
  Mail, 
  Share2, 
  Check, 
  Plus, 
  Award, 
  Compass,
  ArrowRight,
  ShieldCheck,
  Edit,
  AlertCircle,
  Loader2
} from "lucide-react";

interface MemberViewProps {
  profile: Profile;
  referralCount: number;
}

export default function MemberView({ profile, referralCount }: MemberViewProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(profile.full_name || "");
    setPhone(profile.phone || "");
  }, [profile]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const link = `${window.location.origin}/directory?ref=${profile.id}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await updateProfile({
        full_name: fullName,
        phone: phone,
      });
      if (res.success) {
        setIsEditing(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to update profile.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full uppercase tracking-widest block w-fit">
            Y&apos;s Men Member
          </span>
          <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-tight mt-2">
            Hello, {profile.full_name || "Member"}!
          </h1>
          <p className="text-slate-500 font-light text-base">
            Welcome to the SWIR digital directory dashboard. Manage your profile and network referrals.
          </p>
        </div>
        
        <Link 
          href={profile.club_id ? "/dashboard/onboarding" : "/dashboard/profile"}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-600/10 shrink-0 text-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{profile.club_id ? "Register Business" : "Select Club First"}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card (1/3 width) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-blue-950 uppercase tracking-tight flex items-center gap-2">
                <User className="w-4 h-4 text-red-600" />
                <span>Personal Profile</span>
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-950 transition-all"
                  title="Edit Profile"
                >
                  <Edit className="w-4.5 h-4.5" />
                </button>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-800 text-sm font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-800 text-sm font-semibold"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-blue-950 hover:bg-black text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFullName(profile.full_name || "");
                      setPhone(profile.phone || "");
                      setError(null);
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Full Name</p>
                    <p className="text-slate-900 font-bold text-sm truncate mt-1">{profile.full_name}</p>
                  </div>
                </div>
                {!profile.club_id && (
                  <Link href="/dashboard/profile" className="inline-flex text-xs font-bold text-amber-700 hover:text-amber-900">
                    Select your SWIR club to register a business
                  </Link>
                )}

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Email Address</p>
                    <p className="text-slate-900 font-bold text-sm truncate mt-1">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Contact Phone</p>
                    <p className="text-slate-900 font-bold text-sm truncate mt-1">{profile.phone || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Club Affiliation</p>
                    <p className="text-slate-900 font-bold text-sm truncate mt-1">{profile.club || "Not provided"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 bg-green-50 text-green-700 font-bold text-[10px] uppercase px-3 py-2 rounded-xl mt-4">
            <ShieldCheck className="w-4 h-4" />
            <span>Profile Verified</span>
          </div>
        </div>

        {/* Referral Hub Card (2/3 width) */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between gap-6">
          <div className="space-y-6">
            <h3 className="text-lg font-black text-blue-950 uppercase tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
              <Share2 className="w-4 h-4 text-red-600" />
              <span>Referral Network Hub</span>
            </h3>

            <p className="text-slate-500 font-light text-sm leading-relaxed">
              Earn rewards and help grow the SWIR community by sharing the directory with other businesses. Copy your unique link below to start referring and track your points dynamically.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Unique Link Input Card */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Your Personal Referral Link</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-xs text-slate-500 truncate select-all font-mono leading-relaxed">
                    {typeof window !== "undefined" ? `${window.location.origin}/directory?ref=${profile.id}` : `.../directory?ref=${profile.id}`}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="p-2.5 bg-blue-950 hover:bg-black text-white rounded-xl transition-all shadow-sm active:scale-95 shrink-0 flex items-center justify-center w-10 h-10"
                    title="Copy Link"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Referrals Scoreboard Card */}
              <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 flex items-center gap-4 shrink-0">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
                  <Award className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Verified Referrals</p>
                  <p className="text-2xl font-black text-blue-950 mt-1 leading-none">{referralCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-400 font-light">
              Tip: Share your link to help people discover verified SWIR businesses!
            </span>
            <Link 
              href="/directory"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:translate-x-1 transition-all"
            >
              <span>Explore Directory</span>
              <Compass className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Business Registration Panel */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group shadow-lg">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        <div className="relative max-w-2xl space-y-4">
          <h2 className="text-2xl font-black tracking-tight leading-tight">Are you a Business Owner?</h2>
          <p className="text-blue-100/70 font-light text-sm leading-relaxed">
            Escalate your role to a **Business Owner** and list your enterprise in our dynamic, AI-powered hybrid search marketplace. Enable customers to submit direct leads and connect on WhatsApp instantly.
          </p>
          <div className="pt-2">
            <Link 
              href={profile.club_id ? "/dashboard/onboarding" : "/dashboard/profile"}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-950 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-md group/btn text-xs active:scale-95"
            >
              <span>{profile.club_id ? "Set Up Your Listing" : "Select Your Club"}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
