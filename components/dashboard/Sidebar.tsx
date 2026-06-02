"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { 
  Briefcase, 
  Sparkles, 
  MapPin, 
  Mail, 
  CreditCard, 
  User, 
  Share2, 
  Plus, 
  LogOut, 
  Users, 
  Menu, 
  X,
  Zap,
  BarChart3,
  Home,
  Globe,
  LayoutDashboard
} from "lucide-react";
import { Profile } from "@/types/database.types";

interface SidebarProps {
  profile: Profile;
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // Define navigation links based on user roles
  const getNavLinks = () => {
    // Persistent public-facing exit routes for all tiers (improves navigation fluidity)
    const exitLinks = [
      { name: "Main Website", href: "/", icon: Home },
      { name: "Public Directory", href: "/directory", icon: Globe },
    ];

    let roleLinks = [];
    switch (profile.app_role) {
      case "super_admin":
      case "region_admin":
        roleLinks = [
          { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
          { name: "User Audit", href: "/dashboard/users", icon: Users },
          { name: "Regions Directory", href: "/dashboard/regions", icon: MapPin },
          { name: "Business Directory", href: "/dashboard/businesses", icon: Briefcase },
          { name: "Ad Campaigns", href: "/dashboard/campaigns", icon: Sparkles },
        ];
        break;
      case "business_owner":
        roleLinks = [
          { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { name: "My Business", href: "/dashboard/business", icon: Briefcase },
          { name: "Lead Center", href: "/dashboard/leads", icon: Mail },
          { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
          { name: "Boost Promos", href: "/dashboard/promotions", icon: Zap },
          { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
        ];
        break;
      case "member":
      default:
        roleLinks = [
          { name: "My Profile", href: "/dashboard", icon: User },
          { name: "Referral Hub", href: "/dashboard/referrals", icon: Share2 },
          { name: "Register Business", href: "/dashboard/onboarding", icon: Plus },
        ];
        break;
    }
    
    return [...exitLinks, ...roleLinks];
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Toggle Bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-sm">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8">
            <Image 
              src="/ysmen-footer-logo.png"
              alt="Y's Men's International Logo"
              fill
              sizes="32px"
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-black tracking-tighter text-blue-950 uppercase">Y's Men</span>
            <span className="text-[9px] font-bold text-red-600 tracking-widest uppercase mt-0.5">SWIR</span>
          </div>
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-slate-100 text-slate-800 rounded-lg transition-all"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Container */}
      {/* 
        To completely prevent Next.js SSR Hydration Mismatch:
        1. Avoid checking "window.innerWidth" during initial render.
        2. Keep the `<aside>` container unconditionally in the DOM on both Server and Client.
        3. Use responsive Tailwind CSS classes (e.g. "md:translate-x-0" and "-translate-x-full") to handle the desktop/mobile layouts purely in CSS.
      */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 w-72 h-screen bg-slate-50 border-r border-slate-200/80 flex flex-col justify-between p-6 overflow-y-auto text-slate-800 shadow-sm transition-all duration-300 ease-in-out ${
          isOpen 
            ? "translate-x-0 opacity-100" 
            : "-translate-x-full md:translate-x-0 opacity-0 md:opacity-100"
        }`}
      >
        {/* Upper Section */}
        <div>
          {/* Brand Identity aligned with Navbar.tsx */}
          <Link href="/" className="flex items-center gap-3 mb-10 px-2 group">
            <div className="relative w-8 h-8 transition-transform duration-300 group-hover:scale-110">
              <Image 
                src="/ysmen-footer-logo.png"
                alt="Y's Men's International Logo"
                fill
                sizes="32px"
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-black tracking-tighter text-blue-950 uppercase">Y's Men</span>
              <span className="text-[10px] font-bold text-red-600 tracking-widest uppercase mt-0.5">SWIR</span>
            </div>
          </Link>

          {/* Navigation Group */}
          <nav className="space-y-1">
            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] block mb-3">
              Navigation
            </span>
            
            {navLinks.map((link) => {
              // Active state matching: "/" only matches "/" exactly; dashboard links match via startsWith to prevent broad matching
              const isActive = link.href === "/" 
                ? pathname === "/" 
                : pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
              const Icon = link.icon;
              const isExitLink = link.href === "/" || link.href === "/directory";
              
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`group flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? "bg-slate-200/50 border-l-4 border-red-600 text-slate-900 shadow-none font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/30 hover:translate-x-1"
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors duration-300 ${
                    isActive 
                      ? "text-red-600" 
                      : isExitLink
                        ? "text-slate-400 group-hover:text-blue-600"
                        : "text-slate-400 group-hover:text-slate-900"
                  }`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Lower Section (Profile & Actions) */}
        <div className="pt-6 border-t border-slate-200">
          {/* User Identity Info Card */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 mb-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 uppercase shadow-sm">
              {(profile.full_name || "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-sm truncate text-slate-900 leading-tight">
                {profile.full_name || "Nexus User"}
              </h4>
              <span className="text-[10px] font-black text-red-600 uppercase tracking-wider block mt-0.5">
                {profile.app_role.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Sign Out Trigger Button */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50/50 hover:border hover:border-red-100/50 transition-all duration-300 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile drawer (mounted and open) */}
      {mounted && isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm md:hidden animate-fade-in"
        ></div>
      )}
    </>
  );
}
