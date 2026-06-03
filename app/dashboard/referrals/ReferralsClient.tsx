"use client";

import React, { useState } from "react";
import { Share2, Check, Award, Compass } from "lucide-react";
import Link from "next/link";

interface ReferralsClientProps {
  profileId: string;
  referralCount: number;
}

export default function ReferralsClient({ profileId, referralCount }: ReferralsClientProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const link = `${window.location.origin}/directory?ref=${profileId}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-8">
      <div className="space-y-4 max-w-2xl">
        <h3 className="text-xl font-black text-blue-950 uppercase tracking-tight flex items-center gap-2">
          <Share2 className="w-5 h-5 text-red-600" />
          <span>Referral Network Hub</span>
        </h3>
        <p className="text-slate-500 font-light text-sm leading-relaxed">
          Earn recognition and support the SWIR community by sharing the directory with other businesses. When people view business listings using your unique referral link, your score increases dynamically.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Referral link copy */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Your Personal Referral Link</label>
          <div className="flex gap-3">
            <div className="flex-1 bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3 text-xs text-slate-600 truncate select-all font-mono leading-relaxed flex items-center">
              {typeof window !== "undefined" ? `${window.location.origin}/directory?ref=${profileId}` : `.../directory?ref=${profileId}`}
            </div>
            <button
              onClick={handleCopyLink}
              className="p-3 bg-blue-950 hover:bg-black text-white rounded-2xl transition-all shadow-sm active:scale-95 shrink-0 flex items-center justify-center w-12 h-12"
              title="Copy Link"
            >
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Share2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Referrals Scoreboard Card */}
        <div className="bg-slate-50 border border-slate-200/50 rounded-3xl p-6 flex items-center gap-6">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
            <Award className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none">Verified Referrals</p>
            <p className="text-3xl font-black text-blue-950 mt-2 leading-none">{referralCount}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-slate-400 font-light">
          Tip: Share this link on WhatsApp or email to help fellow members get discovered.
        </span>
        <Link 
          href="/directory"
          className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 hover:translate-x-1 transition-all"
        >
          <span>Explore Public Directory</span>
          <Compass className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
