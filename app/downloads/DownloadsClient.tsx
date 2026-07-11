"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Download, Search, CheckCircle2, FileText, FileSpreadsheet, File } from 'lucide-react';
import { motion } from 'framer-motion';

interface DownloadItem {
  file: string;
  title: string;
  description: string;
  type: string;
}

const DOWNLOAD_ITEMS: DownloadItem[] = [
  {
    file: "/downloads/YMintllogo.JPG",
    title: "Y's Men International Logo",
    description: "The official insignia of Y's Men International, representing our global commitment to service since 1922. Ideal for official club correspondence and international communications.",
    type: "Image (JPG)",
  },
  {
    file: "/downloads/YMswirlogo.JPG",
    title: "SWIR Regional Logo",
    description: "The official regional emblem for the South West India Region. Use this for regional event banners, club letterheads, and official regional documentation.",
    type: "Image (JPG)",
  },
  {
    file: "/downloads/careaged.JPG",
    title: "Care the Aged - Regional Project",
    description: "The official logo for the SWIR 2026-27 Regional Project, \"Care the Aged.\" This initiative is dedicated to supporting and uplifting the elderly in our communities through companionship, healthcare support, and dignified living programs. Download this asset to promote regional elder care events.",
    type: "Image (JPG)",
  },
  {
    file: "/downloads/nodrugslogo.JPG",
    title: "Say No To Drugs - Minor Project",
    description: "The official emblem for the SWIR 2026-27 Minor Project, \"Say No To Drugs.\" This campaign focuses on youth awareness, community education, and proactive prevention strategies against substance abuse. Use this for campus initiatives and awareness rallies.",
    type: "Image (JPG)",
  },
  {
    file: "/Charter-Application.pdf",
    title: "Y's Men International Charter Application",
    description: "The official application document to organise and maintain an affiliated Y's Men's club. It includes required signature fields for charter members pledging to the movement's objectives.",
    type: "DOCUMENT (PDF)",
  },
  {
    file: "/Model-Constitution-for-a-Local-Club.docx",
    title: "Model Constitution for a Y's Men's Club",
    description: "A customizable template outlining the fundamental purpose, objectives, officer duties, and membership rules for a local club. It is designed to be adapted to local conditions before final adoption.",
    type: "DOCUMENT (DOCX)",
  },
  {
    file: "/Procedures-for-Charter.pdf",
    title: "Procedures for the Charter of New Clubs",
    description: "Step-by-step guidelines for Regional Directors on applying for a new club charter. It details the required documentation, timeline requirements, and online submission process.",
    type: "DOCUMENT (PDF)",
  },
  {
    file: "/Roster-Template.xlsx",
    title: "Roster Template",
    description: "The standardized spreadsheet used to record all charter member details. It includes mandatory fields for names in the Latin alphabet, contact information, and postal addresses.",
    type: "SPREADSHEET (XLSX)",
  },
];

const isImage = (file: string) => {
  const lowercaseFile = file.toLowerCase();
  return lowercaseFile.endsWith('.jpg') || 
         lowercaseFile.endsWith('.jpeg') || 
         lowercaseFile.endsWith('.png') || 
         lowercaseFile.endsWith('.gif') || 
         lowercaseFile.endsWith('.svg') || 
         lowercaseFile.endsWith('.webp');
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: "easeOut" } 
  },
} as const;

export default function DownloadsClient() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = DOWNLOAD_ITEMS.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="bg-slate-50 py-16 px-4 md:px-8 max-w-7xl mx-auto w-full flex-grow pb-24">
      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-12 relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search resources, logos, or projects..."
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium"
        />
      </div>

      {/* Grid container with motion */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl max-w-xl mx-auto shadow-sm">
          <p className="text-slate-500">No resources found matching "{searchQuery}".</p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10"
        >
          {filteredItems.map((item) => (
            <motion.div
              key={item.title}
              variants={cardVariants}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col h-full"
            >
              {/* Visual Preview Area */}
              <div className="relative h-60 w-full bg-slate-50 flex items-center justify-center p-6 border-b border-slate-100">
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  {isImage(item.file) ? (
                    <Image
                      src={item.file}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-4">
                      {/* Document Card Visual Representation */}
                      <div className="relative w-24 h-28 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col justify-between p-3.5 hover:scale-105 transition-transform duration-300">
                        {/* Top-Right Dog-Ear Fold Effect */}
                        <div className="absolute top-0 right-0 w-6 h-6 bg-slate-100 border-l border-b border-slate-200 rounded-bl-lg rounded-tr-md"></div>
                        
                        {/* File Icon */}
                        <div className="flex-grow flex items-center justify-center mt-2">
                          {item.file.endsWith('.pdf') ? (
                            <FileText className="w-12 h-12 text-rose-500" />
                          ) : item.file.endsWith('.xlsx') ? (
                            <FileSpreadsheet className="w-12 h-12 text-emerald-600" />
                          ) : item.file.endsWith('.docx') ? (
                            <FileText className="w-12 h-12 text-blue-600" />
                          ) : (
                            <File className="w-12 h-12 text-slate-500" />
                          )}
                        </div>

                        {/* File Extension Indicator at bottom */}
                        <div className="text-[10px] font-bold text-center text-slate-400 select-none">
                          {item.file.split('.').pop()?.toUpperCase()}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-200/50 px-2 py-0.5 rounded border border-slate-200/70">
                        {item.type.split(' ').pop()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Details */}
              <div className="p-6 md:p-8 flex-grow flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-600 uppercase tracking-widest">{item.type}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase px-2 py-0.5 bg-slate-100 rounded border border-slate-200/50">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" /> Official Asset
                    </span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-light">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2">
                  <a
                    href={item.file}
                    download={item.file.split('/').pop()}
                    className="inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-600/10 transition-all hover:scale-[1.01] active:scale-95 text-sm uppercase tracking-wider"
                  >
                    <Download className="w-4 h-4" />
                    Download Asset
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
