"use client";

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import AuthButton from '@/components/AuthButton';
import Link from 'next/link';
import Image from 'next/image';

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`w-full border-b border-gray-200 z-50 sticky top-0 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-md shadow-md py-2' 
          : 'bg-white shadow-sm py-0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo & Dropdowns */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center gap-3 border-r border-gray-100 pr-6 mr-2 group">
              <div className="relative w-8 h-8 md:w-10 md:h-10 transition-transform duration-300 group-hover:scale-110">
                <Image 
                  src="/ysmen-footer-logo.png"
                  alt="Y's Men's International Logo"
                  fill
                  sizes="(max-width: 768px) 32px, 40px"
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg md:text-xl font-black tracking-tighter text-blue-950">Y's Men</span>
                <span className="text-[10px] md:text-xs font-bold text-red-600 tracking-widest uppercase">SWIR</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              <Link 
                href="/directory" 
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors py-4"
              >
                Directory
              </Link>

              {/* About Dropdown */}
              <div className="relative group">
                <button className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors py-4">
                  About Y's Men's International
                  <svg className="ml-1 w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute left-0 mt-0 w-48 bg-white border border-gray-100 shadow-lg rounded-b-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link href="/about/philosophy" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      Philosophy & Values
                    </Link>
                    <Link href="/about/history" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      Our History (1922)
                    </Link>
                  </div>
                </div>
              </div>

              {/* SWIR Dropdown */}
              <div className="relative group">
                <button className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors py-4">
                  SWIR
                  <svg className="ml-1 w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute left-0 mt-0 w-48 bg-white border border-gray-100 shadow-lg rounded-b-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link href="/region/leadership" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      Regional Leadership
                    </Link>
                    <Link href="/region/calendar" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      Regional Calendar
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Auth & Dashboard */}
          <div className="flex items-center space-x-4">
            {user && (
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors px-3 py-1 bg-blue-50 rounded-md"
              >
                Dashboard
              </Link>
            )}
            <AuthButton user={user} />
          </div>
        </div>
      </div>
    </nav>
  );
}
