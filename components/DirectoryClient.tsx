"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Business } from '@/types/database.types';
import { getEmbedding } from '@/app/actions/getEmbedding';
import { performHybridSearch, SearchResult, getUniqueCategories } from '@/app/actions/search';
import { syncAllVectors } from '@/app/actions/sync';
import { Search, SearchX, ArrowRight, Briefcase, Sparkles, Filter, XCircle, ChevronDown, CheckCircle2, Zap } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Highlight } from '@/components/ui/Highlight';

// --- Skeleton Loader Component ---
const CardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full animate-pulse">
    <div className="p-8 flex-1">
      <div className="flex items-start justify-between mb-6">
        <div className="h-16 w-16 bg-slate-100 rounded-2xl"></div>
        <div className="h-6 w-24 bg-slate-100 rounded-lg"></div>
      </div>
      <div className="h-6 w-3/4 bg-slate-100 rounded mb-4"></div>
      <div className="h-4 w-1/2 bg-slate-100 rounded mb-6"></div>
      <div className="flex gap-2">
        <div className="h-5 w-12 bg-slate-50 rounded"></div>
        <div className="h-5 w-12 bg-slate-50 rounded"></div>
      </div>
    </div>
    <div className="px-8 py-4 bg-slate-50 border-t border-slate-50 h-12"></div>
  </div>
);

export default function DirectoryClient({ 
  initialBusinesses
}: { 
  initialBusinesses: Business[] 
}) {
  const [businesses, setBusinesses] = useState<(Business | SearchResult)[]>(initialBusinesses);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [availableCategories, setAvailableCategories] = useState<string[]>(['All']);
  const [isSearching, setIsSearching] = useState(false);
  const [isWideSearch, setIsWideSearch] = useState(false);
  const [manualSearchPerformed, setManualSearchPerformed] = useState(false);
  const [isSyncing, startSync] = React.useTransition();

  // Fetch unique categories from database on mount
  React.useEffect(() => {
    const fetchCats = async () => {
      const cats = await getUniqueCategories();
      setAvailableCategories(['All', ...cats]);
    };
    fetchCats();
  }, []);

  const executeSearch = async (query: string, category: string, isManual: boolean) => {
    // Stage 0: Empty Reset Logic
    if (!query.trim() && category === 'All') {
      setBusinesses(initialBusinesses);
      setIsWideSearch(false);
      setManualSearchPerformed(false);
      return;
    }
    
    setIsSearching(true);
    setIsWideSearch(false);
    if (isManual) setManualSearchPerformed(true);
    
    try {
      const results = await performHybridSearch(query, category);
      
      // Automatic Fallback: Wide Search (Only if keyword search failed)
      if (results.length === 0 && category !== 'All') {
        setIsWideSearch(true);
        const wideResults = await performHybridSearch(query, 'All');
        setBusinesses(wideResults);
      } else {
        setBusinesses(results);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Immediate Category Reactivity
  React.useEffect(() => {
    // Avoid double search on mount if initial state is already set
    // But we need it for immediate pivot if category changes
    executeSearch(searchQuery, selectedCategory, false);
  }, [selectedCategory]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSearch(searchQuery, selectedCategory, true);
  };

  // Helper to determine match reason for Semantic Highlighting
  const getMatchReason = (business: Business | SearchResult) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return null;

    // 1. Intent Match (User selected a category or query matches category name)
    const isCategorySelected = selectedCategory !== 'All' && business.category === selectedCategory;
    const isQueryCategory = business.category?.toLowerCase().includes(query);
    
    if (isCategorySelected || isQueryCategory) {
      return { 
        text: `Matches intent: ${business.category}`, 
        icon: <Zap className="w-3 h-3 text-amber-500" />,
        type: 'intent'
      };
    }

    // 2. Keyword Match
    const inBrand = business.brand_name?.toLowerCase().includes(query);
    const inDesc = business.description?.toLowerCase().includes(query);
    if (inBrand || inDesc) {
      return { 
        text: "Keyword match found", 
        icon: <CheckCircle2 className="w-3 h-3 text-blue-500" />,
        type: 'keyword'
      };
    }

    // 3. Semantic Match (Vector similarity)
    return { 
      text: "Semantic vector match", 
      icon: <Sparkles className="w-3 h-3 text-purple-500" />,
      type: 'semantic'
    };
  };

  const handleAdminSync = () => {
    startSync(async () => {
      try {
        const res = await syncAllVectors();
        if (res.success) {
          alert(`Success: ${res.message}`);
        } else {
          alert(`Error: ${res.message}`);
        }
      } catch (err) {
        alert("A fatal error occurred during sync.");
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Search Hero Area */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-slate-50">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-0 right-0 w-1/3 h-full bg-blue-900/5 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2"
          ></motion.div>
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute bottom-0 left-0 w-1/4 h-3/4 bg-red-600/5 blur-3xl rounded-full transform -translate-x-1/2 translate-y-1/2"
          ></motion.div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-blue-950 tracking-tight leading-tight mb-4"
          >
            Members Business Directory
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 font-light"
          >
            Empowering the SWIR community through member-to-member professional networking and collaboration.
          </motion.p>

          <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col md:flex-row items-stretch gap-4"
            >
              <div className="relative flex-grow group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                  placeholder="Search by keyword, brand, or service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="relative min-w-[200px] group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 pointer-events-none">
                  <Filter className="w-4 h-4" />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-10 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all appearance-none text-slate-700 font-medium cursor-pointer"
                >
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 min-w-[140px]"
              >
                {isSearching ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>Search</>
                )}
              </button>
            </motion.div>
          </form>
        </div>
      </section>

      {/* Results Grid with Shared Layout Animations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 flex-grow">
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {isWideSearch && !isSearching && manualSearchPerformed && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center gap-3"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Filter className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-900">No direct matches found in {selectedCategory}</h4>
                  <p className="text-xs text-blue-700/70">Broadening search to the whole directory to find the best recommendations for "{searchQuery}".</p>
                </div>
              </motion.div>
            )}

            {isSearching ? (
              <motion.div 
                key="searching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {[...Array(6)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </motion.div>
            ) : businesses.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="inline-flex items-center justify-center p-4 bg-slate-50 rounded-full mb-4">
                  <SearchX className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  No results found {searchQuery ? `for "${searchQuery}"` : ""}
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                  We couldn't find any businesses matching your search. Try adjusting your keywords or browsing by category.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    executeSearch('', 'All', false);
                  }}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Clear Search
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="grid"
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {businesses.map((business) => (
                  <motion.div
                    key={business.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href={`/directory/${business.id}`}
                      className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer"
                    >
                      {/* Glassmorphism Shimmer Effect Overlay */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden">
                        <div className="absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                      </div>

                      <div className="p-8 flex-1 relative z-10">
                        <div className="flex items-start justify-between mb-6">
                          <motion.div 
                            whileHover={{ rotate: 5, scale: 1.1 }}
                            className="h-16 w-16 bg-blue-900/10 rounded-2xl flex items-center justify-center overflow-hidden border border-blue-900/5 shrink-0"
                          >
                            {business.logo_url ? (
                              <img src={business.logo_url} alt={business.brand_name || ''} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-blue-950 text-2xl font-black">
                                {(business.brand_name || '?').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </motion.div>
                            {business.category && (
                              <div className="flex flex-col items-end gap-1">
                                <span className="px-3 py-1 bg-blue-50 text-blue-800 text-xs font-bold rounded-lg border border-blue-100 uppercase">
                                  {business.category}
                                </span>
                              </div>
                            )}
                        </div>

                        <h3 className="text-xl font-black text-blue-950 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                          {business.brand_name || 'Unnamed Enterprise'}
                        </h3>

                        {business.description && (
                          <div className="text-sm text-slate-600 line-clamp-3 mb-4 font-light leading-relaxed">
                            <Highlight text={business.description} query={searchQuery} />
                          </div>
                        )}

                        {/* Semantic Match Reason - UX Polish */}
                        {getMatchReason(business) && (
                          <div className="flex items-center gap-2 mb-6 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 w-fit">
                            {getMatchReason(business)?.icon}
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              {getMatchReason(business)?.text}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1.5 mt-auto">
                          {business.services?.slice(0, 3).map((service, idx) => (
                            <span key={idx} className="bg-slate-50 text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-200 uppercase">
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center relative z-10">
                        <div className="flex items-center text-xs font-bold text-slate-400">
                          <Briefcase className="w-3.5 h-3.5 mr-2" />
                          Verified Member
                        </div>
                        <motion.div
                          whileHover={{ x: 5 }}
                          className="text-blue-600"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </motion.div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-20 text-center border-t border-slate-100 pt-10">
          <button
            onClick={handleAdminSync}
            disabled={isSyncing}
            className={`text-[10px] font-bold text-slate-300 transition-colors uppercase tracking-[0.2em] ${isSyncing ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-600'}`}
          >
            {isSyncing ? 'SYNCING VECTORS...' : 'NEXUS Admin: Sync Vectors'}
          </button>
        </div>
      </section>
    </div>
  );
}
