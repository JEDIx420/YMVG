"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Search,
  Download,
  Clock,
  Sparkles,
  Award,
  Grid,
  List,
  ChevronRight,
  Shield,
  ArrowRight,
  Filter,
  CheckCircle2,
  HelpCircle
} from "lucide-react";

// TypeScript interfaces
interface CalendarEvent {
  id: number;
  date: string;
  monthYear: string;
  day: string;
  regionalProgram: string;
  areaProgram: string;
  type: "regional" | "area" | "both";
  isUpcoming: boolean; // Relative to May 21, 2026
}

// 43 Calendar Events Transcribed Exactly from the Consolidated PDF
const calendarEvents: CalendarEvent[] = [
  { id: 1, date: "26th", monthYear: "January 2026", day: "Sunday", regionalProgram: "Online Meeting with DGEs & LRDEs", areaProgram: "", type: "regional", isUpcoming: false },
  { id: 2, date: "07th & 08th", monthYear: "February 2026", day: "Sat/Sun", regionalProgram: "", areaProgram: "RDEs & DGEs Training Program", type: "area", isUpcoming: false },
  { id: 3, date: "10th to 14th", monthYear: "March 2026", day: "Tue/Fri", regionalProgram: "", areaProgram: "RDE Summit – Bali – Indonesia", type: "area", isUpcoming: false },
  { id: 4, date: "11th & 12th", monthYear: "April 2026", day: "Sat/Sun", regionalProgram: "DGE/LRDE Team & Regional Cabinet team Training/Meeting @ YMCA Kanyakumari", areaProgram: "", type: "regional", isUpcoming: false },
  { id: 5, date: "13th", monthYear: "June 2026", day: "Saturday", regionalProgram: "Regional Installation at Srimoolam Club, Thiruvananthapuram", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 6, date: "28th", monthYear: "June 2026", day: "Sunday", regionalProgram: "", areaProgram: "Area Convention Installation & Award Night", type: "area", isUpcoming: true },
  { id: 7, date: "5th", monthYear: "July 2026", day: "Sunday", regionalProgram: "2nd DGs & LRDs Meet with RD - Online", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 8, date: "11th", monthYear: "July 2026", day: "Saturday", regionalProgram: "1st Regional Council and RSD training - Zone II", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 9, date: "12th", monthYear: "July 2026", day: "Sunday", regionalProgram: "Enlightening Talk - online", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 10, date: "25th", monthYear: "July 2026", day: "Saturday", regionalProgram: "", areaProgram: "1st Area Constitutional Council Meeting", type: "area", isUpcoming: true },
  { id: 11, date: "26th", monthYear: "July 2026", day: "Sunday", regionalProgram: "", areaProgram: "ASD Training & 1st Extended Area Council Meeting", type: "area", isUpcoming: true },
  { id: 12, date: "9th", monthYear: "August 2026", day: "Sunday", regionalProgram: "Enlightening Talk - online", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 13, date: "7th to 13th", monthYear: "September 2026", day: "Mon/Sun", regionalProgram: "", areaProgram: "International Tour with Participation in IC 2026 (10th to 13th September 2026)", type: "area", isUpcoming: true },
  { id: 14, date: "13th", monthYear: "September 2026", day: "Sunday", regionalProgram: "Enlightening Talk - online", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 15, date: "3rd & 4th", monthYear: "October 2026", day: "Sat/Sun", regionalProgram: "Regional Youth Camp", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 16, date: "11th", monthYear: "October 2026", day: "Sunday", regionalProgram: "Enlightening Talk - online", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 17, date: "18th", monthYear: "October 2026", day: "Sunday", regionalProgram: "International Tour", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 18, date: "1st", monthYear: "November 2026", day: "Sunday", regionalProgram: "REGIONAL KIDS FEST - at YMCA Thiruvananthapuram", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 19, date: "8th", monthYear: "November 2026", day: "Sunday", regionalProgram: "Enlightening Talk - online", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 20, date: "14th", monthYear: "November 2026", day: "Saturday", regionalProgram: "2nd Regional Council at Kollam - Zone III", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 21, date: "22nd", monthYear: "November 2026", day: "Sunday", regionalProgram: "Regional Cultural meet", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 22, date: "29th", monthYear: "November 2026", day: "Sunday", regionalProgram: "", areaProgram: "2nd Constitutional Council & 2nd Extended Area Council Meeting", type: "area", isUpcoming: true },
  { id: 23, date: "6th", monthYear: "December 2026", day: "Sunday", regionalProgram: "2nd DGs & LRDs Meet with RD online", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 24, date: "12th", monthYear: "December 2026", day: "Saturday", regionalProgram: "Founder’s Day, Christmas & New Year Celebration", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 25, date: "13th", monthYear: "December 2026", day: "Sunday", regionalProgram: "Enlightening Talk - online", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 26, date: "9th", monthYear: "January 2027", day: "Saturday", regionalProgram: "Regional Sports Meet", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 27, date: "10th", monthYear: "January 2027", day: "Sunday", regionalProgram: "Enlightening Talk - online", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 28, date: "15th - 17th", monthYear: "January 2027", day: "Fri-Sun", regionalProgram: "", areaProgram: "Area Youth Camp", type: "area", isUpcoming: true },
  { id: 29, date: "13th & 14th", monthYear: "February 2027", day: "Sat/Sun", regionalProgram: "", areaProgram: "RDE & DGE Training", type: "area", isUpcoming: true },
  { id: 30, date: "14th", monthYear: "February 2027", day: "Sunday", regionalProgram: "Enlightening Talk - online", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 31, date: "21st", monthYear: "February 2027", day: "Sunday", regionalProgram: "", areaProgram: "Midyear meetings with RDs & DGs / 3rd Area Council", type: "area", isUpcoming: true },
  { id: 32, date: "7th", monthYear: "March 2027", day: "Sunday", regionalProgram: "", areaProgram: "Leaders Meet & India Area Family Fest", type: "area", isUpcoming: true },
  { id: 33, date: "8th", monthYear: "March 2027", day: "Monday", regionalProgram: "Regional Election Notice", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 34, date: "13th", monthYear: "March 2027", day: "Saturday", regionalProgram: "3rd Regional Council - Zone IV", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 35, date: "14th", monthYear: "March 2027", day: "Sunday", regionalProgram: "Enlightening Talk - online", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 36, date: "27th", monthYear: "March 2027", day: "Saturday", regionalProgram: "", areaProgram: "3rd Area Constitutional Council Meeting", type: "area", isUpcoming: true },
  { id: 37, date: "28th", monthYear: "March 2027", day: "Sunday", regionalProgram: "", areaProgram: "3rd Area Extended Council Meeting", type: "area", isUpcoming: true },
  { id: 38, date: "4th", monthYear: "April 2027", day: "Sunday", regionalProgram: "3rd DGs & LRDs Meet with RD", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 39, date: "11th", monthYear: "April 2027", day: "Sunday", regionalProgram: "Enlightening Talk - online", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 40, date: "23rd", monthYear: "April 2027", day: "Friday", regionalProgram: "REGIONAL TOUR - ODISHA", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 41, date: "8th", monthYear: "May 2027", day: "Saturday", regionalProgram: "Regional Election", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 42, date: "9th", monthYear: "May 2027", day: "Sunday", regionalProgram: "Enlightening Talk - online", areaProgram: "", type: "regional", isUpcoming: true },
  { id: 43, date: "12th", monthYear: "June 2027", day: "Saturday", regionalProgram: "4th Regional Council and Regional Convention - Zone I", areaProgram: "", type: "regional", isUpcoming: true }
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
} as const;

// Helper to get local date at 00:00:00 in India Time Zone (IST)
function getCurrentISTDate(): Date {
  const now = new Date();
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric' as const, month: 'numeric' as const, day: 'numeric' as const };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(now);
  
  const year = parseInt(parts.find(p => p.type === 'year')!.value, 10);
  const month = parseInt(parts.find(p => p.type === 'month')!.value, 10) - 1; // 0-indexed month
  const day = parseInt(parts.find(p => p.type === 'day')!.value, 10);
  
  return new Date(year, month, day);
}

// Helper to convert event date text to an IST Date object representing the start date
function getEventISTDate(dateStr: string, monthYearStr: string): Date {
  // Extract first number for ranges like "07th & 08th", "10th to 14th", "15th - 17th"
  const dayMatch = dateStr.match(/\d+/);
  const day = dayMatch ? parseInt(dayMatch[0], 10) : 1;
  
  const parts = monthYearStr.trim().split(/\s+/);
  const monthName = parts[0];
  const year = parseInt(parts[1], 10);
  
  const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const month = months.indexOf(monthName.toLowerCase());
  
  return new Date(year, month >= 0 ? month : 0, day);
}

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "regional" | "area">("all");
  const [timeFilter, setTimeFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [layoutMode, setLayoutMode] = useState<"timeline" | "grid">("timeline");
  
  // Hydration protection
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get the current IST date at 00:00:00
  const currentISTDate = useMemo(() => {
    if (!mounted) return new Date(2026, 4, 21); // Default fallback matching static layout metadata
    return getCurrentISTDate();
  }, [mounted]);

  // Compute dynamic isUpcoming for all events based on live IST date
  const dynamicEvents = useMemo(() => {
    return calendarEvents.map(event => {
      const eventDate = getEventISTDate(event.date, event.monthYear);
      const isUpcoming = eventDate >= currentISTDate;
      return {
        ...event,
        isUpcoming
      };
    });
  }, [currentISTDate]);

  // Stats computation
  const stats = useMemo(() => {
    const total = dynamicEvents.length;
    const regional = dynamicEvents.filter((e) => e.type === "regional").length;
    const area = dynamicEvents.filter((e) => e.type === "area").length;
    return { total, regional, area };
  }, [dynamicEvents]);

  // Determine the next upcoming event relative to live IST date
  const nextEventData = useMemo(() => {
    const upcoming = dynamicEvents.filter(e => e.isUpcoming);
    if (upcoming.length === 0) {
      // Fallback if all events have passed
      return {
        event: dynamicEvents[dynamicEvents.length - 1],
        daysRemaining: 0,
        countdownText: "All scheduled events completed"
      };
    }

    // Sort upcoming events by date ascending to find the closest one
    const sorted = [...upcoming].sort((a, b) => {
      const dateA = getEventISTDate(a.date, a.monthYear);
      const dateB = getEventISTDate(b.date, b.monthYear);
      return dateA.getTime() - dateB.getTime();
    });

    const closestEvent = sorted[0];
    const eventDate = getEventISTDate(closestEvent.date, closestEvent.monthYear);
    
    // Calculate difference in days
    const diffTime = eventDate.getTime() - currentISTDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let countdownText = `Exactly ${diffDays} Days Remaining`;
    if (diffDays === 0) {
      countdownText = "Today";
    } else if (diffDays === 1) {
      countdownText = "Tomorrow";
    }

    return {
      event: closestEvent,
      daysRemaining: diffDays,
      countdownText
    };
  }, [dynamicEvents, currentISTDate]);

  const nextEvent = nextEventData.event;

  // Filter and search logic
  const filteredEvents = useMemo(() => {
    return dynamicEvents.filter((event) => {
      // 1. Search Query Filter
      const title = (event.regionalProgram || event.areaProgram).toLowerCase();
      const month = event.monthYear.toLowerCase();
      const day = event.day.toLowerCase();
      const date = event.date.toLowerCase();
      const matchesSearch =
        title.includes(searchQuery.toLowerCase()) ||
        month.includes(searchQuery.toLowerCase()) ||
        day.includes(searchQuery.toLowerCase()) ||
        date.includes(searchQuery.toLowerCase());

      // 2. Type Filter (All, Regional, Area)
      const matchesType =
        typeFilter === "all" ||
        event.type === typeFilter;

      // 3. Time Filter (Upcoming, Past, All)
      const matchesTime =
        timeFilter === "all" ||
        (timeFilter === "upcoming" && event.isUpcoming) ||
        (timeFilter === "past" && !event.isUpcoming);

      return matchesSearch && matchesType && matchesTime;
    });
  }, [dynamicEvents, searchQuery, typeFilter, timeFilter]);

  // Group events by Month & Year for Grid View
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: CalendarEvent[] } = {};
    filteredEvents.forEach((event) => {
      if (!groups[event.monthYear]) {
        groups[event.monthYear] = [];
      }
      groups[event.monthYear].push(event);
    });
    return groups;
  }, [filteredEvents]);



  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans pb-24">
      {/* 1. Hero Banner Section */}
      <section className="relative bg-blue-950 py-24 px-4 text-center overflow-hidden border-b border-blue-900">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-800 text-blue-300 text-xs font-semibold tracking-wider uppercase"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-red-500" />
            SWIR Calendar 2026 - 2027
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight"
          >
            REGIONAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">CALENDAR</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-blue-100/80 font-light max-w-2xl mx-auto leading-relaxed"
          >
            Stay aligned with all district summits, training sessions, cabinet assemblies, and regional festivals scheduled across the South West India Region.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="pt-4 flex flex-wrap justify-center gap-4"
          >
            <a
              href="/calendar/Consolidated - Area & Reg Calendar 2026 - 27.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-950/20 group hover:shadow-xl hover:shadow-red-600/10"
            >
              <Download className="w-4.5 h-4.5 group-hover:-translate-y-0.5 transition-transform" />
              Download Consolidated PDF
            </a>
          </motion.div>
        </div>
      </section>

      {/* 2. Interactive Spotlight Panel & Statistics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Next major event card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="lg:col-span-7 bg-white rounded-[32px] shadow-lg border border-slate-100 p-8 flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-shadow duration-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-600/5 to-transparent pointer-events-none rounded-bl-full"></div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-black uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                  Next Major Programme
                </span>
                <span className="text-slate-400 text-xs font-semibold">{nextEvent.monthYear} Focus</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl md:text-3xl font-extrabold text-blue-950 tracking-tight leading-tight group-hover:text-red-600 transition-colors">
                  {nextEvent.regionalProgram || nextEvent.areaProgram}
                </h3>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 pt-2 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-red-500" />
                    {nextEvent.date} {nextEvent.monthYear} ({nextEvent.day})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-blue-600" />
                    Regional Cabinet Event
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Estimated Countdown</p>
                <p className="text-lg font-black text-blue-950 mt-0.5">
                  {mounted ? nextEventData.countdownText : "Loading Countdown..."}
                </p>
              </div>
              <Link
                href="#timeline-container"
                className="inline-flex items-center gap-2 text-sm font-bold text-red-600 hover:text-blue-950 transition-colors group/link self-start sm:self-center"
              >
                View in Timeline
                <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1.5 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Quick Metrics Grid */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-6">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md hover:shadow-lg transition-shadow flex items-center gap-5"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                <CalendarIcon className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-blue-950">{stats.total}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total Scheduled Events</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md hover:shadow-lg transition-shadow flex items-center gap-5"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shrink-0">
                <Sparkles className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-red-600">{stats.regional}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Regional Programmes</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md hover:shadow-lg transition-shadow flex items-center gap-5"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
                <Award className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-blue-600">{stats.area}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Area Programmes</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. Search and Filtering Controls Dashboard */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Search Input */}
            <div className="lg:col-span-5 relative">
              <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search events by title, month, day..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
              />
            </div>

            {/* Filter Tabs (All / Regional / Area) */}
            <div className="lg:col-span-4 flex flex-wrap gap-2">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                  typeFilter === "all"
                    ? "bg-blue-950 text-white border-blue-950 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                All Programs
              </button>
              <button
                onClick={() => setTypeFilter("regional")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                  typeFilter === "regional"
                    ? "bg-red-600 text-white border-red-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Regional Only
              </button>
              <button
                onClick={() => setTypeFilter("area")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                  typeFilter === "area"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Area Only
              </button>
            </div>

            {/* Layout Toggle on Right */}
            <div className="lg:col-span-3 flex justify-between lg:justify-end items-center gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block lg:hidden">Display Layout:</span>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/50">
                <button
                  onClick={() => setLayoutMode("timeline")}
                  className={`p-2 rounded-lg transition-all ${
                    layoutMode === "timeline"
                      ? "bg-white text-blue-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Timeline Layout"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLayoutMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    layoutMode === "grid"
                      ? "bg-white text-blue-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Month Grid Layout"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Timeframe Slider Tab (Upcoming vs Past Events) */}
          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setTimeFilter("upcoming")}
                className={`px-4.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  timeFilter === "upcoming"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-white text-slate-500 border border-transparent hover:text-slate-800"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Upcoming Events (June 2026 onwards)
              </button>
              <button
                onClick={() => setTimeFilter("past")}
                className={`px-4.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  timeFilter === "past"
                    ? "bg-slate-100 text-slate-700 border border-slate-200"
                    : "bg-white text-slate-500 border border-transparent hover:text-slate-800"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Past Programmes (Jan - Apr 2026)
              </button>
              <button
                onClick={() => setTimeFilter("all")}
                className={`px-4.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  timeFilter === "all"
                    ? "bg-slate-100 text-slate-700 border border-slate-200"
                    : "bg-white text-slate-500 border border-transparent hover:text-slate-800"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                All Time (2026 - 27)
              </button>
            </div>
            
            <p className="text-xs text-slate-400 font-medium">
              Showing <span className="font-bold text-slate-600">{filteredEvents.length}</span> events matching parameters
            </p>
          </div>
        </div>
      </section>

      {/* 4. Calendar Layout Rendering */}
      <section id="timeline-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <AnimatePresence mode="wait">
          {filteredEvents.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-xl mx-auto px-6 space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto border border-slate-100 text-slate-400">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-blue-950 tracking-tight">No Events Match Filters</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                We couldn't find any events matching your search keyword or selected filtering. Try adjusting filters or typing another term.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("all");
                  setTimeFilter("all");
                }}
                className="px-5 py-2.5 bg-blue-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
              >
                Reset All Filters
              </button>
            </motion.div>
          ) : layoutMode === "timeline" ? (
            /* Layout A: Vertical Timeline View */
            <motion.div
              key="timeline-layout"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="relative pl-12 sm:pl-16 space-y-12 before:absolute before:left-6 sm:before:left-8 before:top-4 before:bottom-4 before:w-[2px] before:bg-blue-900/10 before:-translate-x-1/2"
            >
              {filteredEvents.map((event, index) => {
                const title = event.regionalProgram || event.areaProgram;
                return (
                  <motion.div
                    key={event.id}
                    variants={cardVariants}
                    className="relative flex flex-col md:flex-row md:items-start gap-6 lg:gap-8 group"
                  >
                    {/* Glowing circular timeline indicator node */}
                    <div className="absolute left-[-24px] sm:left-[-32px] top-4 z-10 -translate-x-1/2 flex items-center justify-center">
                      <div className={`w-4 h-4 rounded-full border-[3px] bg-white transition-all duration-300 group-hover:scale-125 ${
                        event.type === "regional"
                          ? "border-red-600 group-hover:border-red-500 group-hover:shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                          : "border-blue-600 group-hover:border-blue-500 group-hover:shadow-[0_0_12px_rgba(37,99,235,0.5)]"
                      }`}></div>
                    </div>

                    {/* Date Block Left */}
                    <div className="md:w-48 shrink-0 space-y-1">
                      <p className={`text-2xl font-black tracking-tight leading-none ${
                        event.type === "regional" ? "text-red-600" : "text-blue-900"
                      }`}>
                        {event.date}
                      </p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                        {event.monthYear}
                      </p>
                      <p className="text-xs font-medium text-slate-500 capitalize leading-none pt-0.5">
                        {event.day}
                      </p>
                    </div>

                    {/* Content Card Right */}
                    <div className="flex-grow bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-slate-200/80 hover:-translate-y-0.5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-3">
                          
                          {/* Event type badge */}
                          <div className="flex items-center gap-2">
                            {event.type === "regional" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-wider">
                                <Sparkles className="w-3 h-3" />
                                Regional Programme
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                                <Award className="w-3 h-3" />
                                Area Programme
                              </span>
                            )}
                            
                            {/* Time badge */}
                            {!event.isUpcoming ? (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[9px] font-semibold uppercase tracking-wider">
                                Completed
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-[9px] font-semibold uppercase tracking-wider animate-pulse">
                                Scheduled
                              </span>
                            )}
                          </div>

                          <h4 className="text-lg md:text-xl font-bold text-blue-950 tracking-tight leading-snug">
                            {title}
                          </h4>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            /* Layout B: Month Grid View */
            <motion.div
              key="grid-layout"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {Object.keys(groupedEvents).map((monthYear) => (
                <div key={monthYear} className="space-y-6">
                  {/* Month cluster divider banner */}
                  <div className="flex items-center gap-4">
                    <span className="px-4 py-1.5 bg-blue-950 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-sm">
                      {monthYear}
                    </span>
                    <div className="flex-grow h-[1px] bg-slate-200"></div>
                  </div>

                  {/* Grid layout cards of the month */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedEvents[monthYear].map((event) => {
                      const title = event.regionalProgram || event.areaProgram;
                      return (
                        <motion.div
                          key={event.id}
                          variants={cardVariants}
                          className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-lg hover:border-slate-200 transition-all duration-300 flex flex-col justify-between h-full hover:-translate-y-0.5 group"
                        >
                          <div className="space-y-4">
                            {/* Top row */}
                            <div className="flex items-center justify-between">
                              <span className={`text-xl font-black tracking-tight ${
                                event.type === "regional" ? "text-red-600" : "text-blue-900"
                              }`}>
                                {event.date}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{event.day}</span>
                            </div>

                            {/* Badge */}
                            <div>
                              {event.type === "regional" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-wider">
                                  <Sparkles className="w-3 h-3" />
                                  Regional Programme
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                                  <Award className="w-3 h-3" />
                                  Area Programme
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <h4 className="text-base font-bold text-blue-950 tracking-tight leading-snug group-hover:text-red-600 transition-colors line-clamp-3">
                              {title}
                            </h4>
                          </div>

                          <div className="pt-4 mt-6 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-400">
                            <span>Status:</span>
                            {!event.isUpcoming ? (
                              <span className="text-slate-500 font-bold">Completed</span>
                            ) : (
                              <span className="text-green-600 font-bold">Scheduled</span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 5. Footer Consolidated CTA Block */}
      <section className="max-w-4xl mx-auto px-4 text-center mt-28">
        <div className="p-8 md:p-12 rounded-[40px] bg-gradient-to-br from-blue-950 to-blue-900 text-white relative overflow-hidden shadow-xl border border-blue-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="relative z-10 space-y-6">
            <h3 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">
              Looking for a Printable Calendar?
            </h3>
            <p className="text-blue-100/80 text-base md:text-lg max-w-xl mx-auto font-light leading-relaxed">
              If you require a copy of the official Consolidated Area & Regional Calendar to print or save offline, grab the PDF compilation. It lists all dates, program types, and event schedules.
            </p>
            <div className="pt-4 flex justify-center">
              <a
                href="/calendar/Consolidated - Area & Reg Calendar 2026 - 27.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 bg-red-600 text-white hover:bg-red-700 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                View & Save Consolidated Calendar PDF
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
