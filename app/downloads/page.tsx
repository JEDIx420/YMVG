import React from 'react';
import DownloadsClient from './DownloadsClient';
import { Shield } from 'lucide-react';

export const metadata = {
  title: "Official Downloads & Resources - Y's Men SWIR",
  description: "Access official Y's Men International and South West India Region (SWIR) brand assets, regional project logos, and promotional campaign materials.",
};

export default function DownloadsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* 1. Header Banner */}
      <section className="relative bg-blue-950 py-20 px-4 text-center overflow-hidden border-b border-blue-900">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -ml-32 -mb-32"></div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-800 text-blue-300 text-xs font-semibold tracking-wider uppercase"
          >
            <Shield className="w-3.5 h-3.5 text-red-500" />
            SWIR Media Center
          </div>
          <h1
            className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight"
          >
            OFFICIAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">DOWNLOADS</span>
          </h1>
          <p
            className="text-lg md:text-xl text-blue-100/80 font-light max-w-2xl mx-auto leading-relaxed"
          >
            Official Y's Men International and South West India Region (SWIR) brand assets, regional project logos, and promotional campaign materials.
          </p>
        </div>
      </section>

      {/* 2. Interactive Client Content Section */}
      <DownloadsClient />
    </div>
  );
}
