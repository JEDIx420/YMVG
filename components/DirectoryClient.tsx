"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Business } from '@/types/database.types';
import { getEmbedding } from '@/app/actions/getEmbedding';
import { Search, ArrowRight, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function DirectoryClient({ 
  initialBusinesses
}: { 
  initialBusinesses: Business[] 
}) {
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setBusinesses(initialBusinesses);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const queryEmbedding = await getEmbedding(searchQuery);
      if (!queryEmbedding) {
        throw new Error("Failed to generate embedding via NVIDIA NIM");
      }

      // Hybrid Search RPC
      const { data, error } = await supabase.rpc('match_businesses', {
        query_embedding: queryEmbedding,
        query_text: searchQuery,
        match_count: 10
      });

      if (!error && data) {
        setBusinesses(data as Business[]);
      } else {
        console.error("RPC Error:", error);
      }
    } catch (err) {
      console.error("Search Error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdminSync = async () => {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .is('embedding', null);
      
    if (error || !data) {
      alert('Error fetching records without embeddings');
      return;
    }

    if (data.length === 0) {
      alert('All businesses already have embeddings!');
      return;
    }
    
    alert(`Found ${data.length} records. Syncing via NIM...`);
    
    for (const b of data as Business[]) {
      try {
        const textToEmbed = `${b.brand_name || ''} ${b.category || ''} ${(b.services || []).join(' ')} ${b.description || ''}`;
        const embedding = await getEmbedding(textToEmbed);
        
        if (embedding) {
          await supabase.from('businesses').update({ embedding }).eq('id', b.id);
        }
      } catch (err) {
        console.error(`Sync iteration error:`, err);
      }
    }
    alert("Sync complete!");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* STEP 1: Search Hero Area */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        {/* Subtle Decorative Background */}
        <div className="absolute inset-0 bg-slate-50">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-900/5 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-1/4 h-3/4 bg-red-600/5 blur-3xl rounded-full transform -translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-blue-950 tracking-tight leading-tight mb-4">
            Members Business Directory
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 font-light">
            Empowering the SWIR community through member-to-member professional networking and collaboration.
          </p>

          {/* STEP 2: Premium Search Input */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative flex items-center group">
              <div className="absolute left-5 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                className="w-full pl-14 pr-32 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                placeholder="Search by keyword, industry, or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-red-600/20"
              >
                {isSearching ? '...' : 'Search'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* STEP 3: Results Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 flex-grow">
        {businesses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="inline-flex items-center justify-center p-4 bg-slate-50 rounded-full mb-4">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No matches found. Try a different industry or keyword.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {businesses.map((business) => (
              <Link
                key={business.id}
                href={`/directory/${business.id}`}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
              >
                <div className="p-8 flex-1">
                  <div className="flex items-start justify-between mb-6">
                    <div className="h-16 w-16 bg-blue-900/10 rounded-2xl flex items-center justify-center overflow-hidden border border-blue-900/5 shrink-0 transition-transform group-hover:scale-105">
                      {business.logo_url ? (
                        <img
                          src={business.logo_url}
                          alt={`${business.brand_name} Logo`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-blue-950 text-2xl font-black">
                          {(business.brand_name || '?').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {business.category && (
                      <span className="px-3 py-1 bg-blue-50 text-blue-800 text-xs font-bold rounded-lg border border-blue-100 uppercase tracking-wider">
                        {business.category}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-blue-950 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                    {business.brand_name || 'Unnamed Enterprise'}
                  </h3>

                  {business.tagline && (
                    <p className="text-sm text-slate-500 italic mb-6 leading-relaxed">
                      "{business.tagline}"
                    </p>
                  )}

                  {business.services && business.services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {business.services.slice(0, 3).map((service, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-50 text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-200 uppercase"
                        >
                          {service}
                        </span>
                      ))}
                      {business.services.length > 3 && (
                        <span className="text-slate-400 text-[10px] flex items-center ml-1">
                          +{business.services.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card "Action Area" Footer */}
                <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center group/footer">
                  <div className="flex items-center text-xs font-bold text-slate-400">
                    <Briefcase className="w-3.5 h-3.5 mr-2" />
                    Verified Member
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-20 text-center border-t border-slate-100 pt-10">
          <button
            onClick={handleAdminSync}
            className="text-[10px] font-bold text-slate-300 hover:text-blue-600 transition-colors uppercase tracking-[0.2em]"
          >
            NEXUS Admin: Sync Vectors
          </button>
        </div>
      </section>
    </div>
  );
}
