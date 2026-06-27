"use client";

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import AuthButton from '@/components/AuthButton';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isDashboard = pathname?.startsWith('/dashboard');

  const publicLinks = [
    { name: "Directory", href: "/directory" },
    { name: "Downloads", href: "/downloads" },
    {
      name: "About Y's Men's International",
      subLinks: [
        { name: "Philosophy & Values", href: "/about/philosophy" },
        { name: "Our History (1922)", href: "/about/history" }
      ]
    },
    {
      name: "SWIR",
      subLinks: [
        { name: "Regional Leadership", href: "/region/leadership" },
        { name: "Regional Calendar", href: "/region/calendar" }
      ]
    },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/contact" }
  ];

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
              <div className="flex flex-col leading-tight">
                <span className="text-sm md:text-base font-black tracking-tight text-blue-950 uppercase">Y's Men</span>
                <span className="text-xs md:text-sm font-black text-red-600 tracking-[0.18em] uppercase">SWIR</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
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

              <Link 
                href="/downloads" 
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors py-4"
              >
                Downloads
              </Link>
              <Link 
                href="/blog" 
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors py-4"
              >
                Blog
              </Link>
              <Link 
                href="/contact" 
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors py-4"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Right: Auth & Dashboard / Hamburger Toggle */}
          <div className="flex items-center space-x-4">
            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center space-x-4">
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

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg md:hidden transition-all outline-none"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Smart Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden w-full bg-white border-b border-slate-200 overflow-hidden shadow-lg"
          >
            <div className="px-6 py-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {isDashboard ? (
                <>
                  {/* Escape Hatch Link */}
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-3 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    style={{ minHeight: "44px" }}
                  >
                    Dashboard Home
                  </Link>
                  <hr className="border-slate-200" />
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                    Explore Public Site
                  </div>
                </>
              ) : null}

              {/* Public Site Links */}
              {publicLinks.map((link, idx) => (
                <div key={idx} className="space-y-1">
                  {link.subLinks ? (
                    <>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 pt-2">
                        {link.name}
                      </div>
                      {link.subLinks.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block px-6 py-2.5 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                          style={{ minHeight: "44px" }}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-3 text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
                      style={{ minHeight: "44px" }}
                    >
                      {link.name}
                    </Link>
                  )}
                </div>
              ))}

              {/* Authentication & Dashboard Action Link (Public Site View bottom) */}
              {!isDashboard ? (
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                  {user ? (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl text-center transition-colors flex items-center justify-center"
                        style={{ minHeight: "44px" }}
                      >
                        Go to Dashboard
                      </Link>
                      <button
                        onClick={async () => {
                          const supabase = (await import('@/utils/supabase/client')).createClient();
                          await supabase.auth.signOut();
                          setIsMobileMenuOpen(false);
                          window.location.reload();
                        }}
                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-center transition-colors flex items-center justify-center"
                        style={{ minHeight: "44px" }}
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full block py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-center shadow transition-colors flex items-center justify-center"
                      style={{ minHeight: "44px" }}
                    >
                      Member Login
                    </Link>
                  )}
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
