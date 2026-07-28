"use client";

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Sparkles, HeartHandshake } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="relative w-12 h-12 transition-transform duration-300 group-hover:scale-105">
                <Image 
                  src="/ysmen-footer-logo.png"
                  alt="Y's Men's International Logo"
                  fill
                  sizes="48px"
                  className="object-contain filter drop-shadow"
                />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tighter">
                Y's Men's International <span className="text-red-500">SWIR</span>
              </h2>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs text-gray-400">
              The South West India Region (SWIR) of Y's Men's International is dedicated to service, fellowship, and building sustainable communities through our global network of clubs.
            </p>

            {/* Premium SWIR 2026-27 Theme & Slogan Card */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -3, scale: 1.01 }}
              transition={{ duration: 0.4 }}
              className="relative p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 via-blue-950/80 to-slate-900/90 border border-amber-400/30 hover:border-amber-400/60 shadow-lg hover:shadow-[0_0_25px_rgba(251,191,36,0.15)] transition-all duration-300 group overflow-hidden max-w-sm"
            >
              {/* Subtle Ambient Glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl group-hover:bg-amber-400/20 transition-all duration-500"></div>

              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>SWIR 2026 – 27 Mandate</span>
                </div>
                
                <div>
                  <span className="text-[10px] text-amber-300/80 font-bold uppercase tracking-wider block">Theme</span>
                  <p className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-400 leading-snug">
                    “Moving Forward Together for Success”
                  </p>
                </div>

                <div className="pt-1 border-t border-white/5">
                  <span className="text-[10px] text-blue-300/80 font-bold uppercase tracking-wider block">Slogan</span>
                  <p className="text-xs text-blue-200 font-medium italic leading-relaxed flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>“Let us Grow Together by Helping Each other”</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">
              Quick Links
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/about/philosophy" className="text-sm hover:text-blue-400 transition-colors">
                  Philosophy & Values
                </Link>
              </li>
              <li>
                <Link href="/about/history" className="text-sm hover:text-blue-400 transition-colors">
                  Heritage & History
                </Link>
              </li>
              <li>
                <Link href="/region/leadership" className="text-sm hover:text-blue-400 transition-colors">
                  Regional Leadership
                </Link>
              </li>
              <li>
                <Link href="/region/calendar" className="text-sm hover:text-blue-400 transition-colors">
                  Regional Calendar
                </Link>
              </li>
              <li>
                <a 
                  href="https://ysmen.org" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm hover:text-blue-400 transition-colors flex items-center"
                >
                  Global Y's Men's International Site
                  <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">
              Contact SWIR
            </h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start">
                <svg className="mr-3 h-5 w-5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>
                  Manchadivila Rd, Plammoodu,<br />
                  Thiruvananthapuram, Kerala 695003
                </span>
              </li>
              <li className="flex items-center">
                <svg className="mr-3 h-5 w-5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:info@ymiswir.org" className="hover:text-blue-400 transition-colors">
                  info@ymiswir.org
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>© {currentYear} Y's Men International - South West India Region. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <span className="hover:text-gray-400 transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-400 transition-colors cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
