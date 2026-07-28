"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Globe, Clock, Heart, Handshake, TrendingUp, Users, Sparkles, ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "circOut" as const } 
  },
} as const;

export default function LandingClientLayout({ children }: { children: React.ReactNode }) {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Parallax effect: translate background slightly slower than scroll
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <div className="flex flex-col min-h-screen font-sans overflow-hidden">
      {/* Step 1: NGO Hero Section with Parallax */}
      <section 
        ref={heroRef}
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden" 
      >
        {/* Parallax Background Image */}
        <motion.div 
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=2070&auto=format&fit=crop')`,
            y: backgroundY,
          }}
          className="absolute inset-0 bg-cover bg-center"
        />
        
        {/* Navy Overlay */}
        <div className="absolute inset-0 bg-blue-950/85 mix-blend-multiply"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8 relative w-20 h-20 md:w-28 md:h-28 mx-auto"
          >
            <Image 
              src="/ysmen-footer-logo.png"
              alt="Y's Men Official Logo"
              fill
              sizes="(max-width: 768px) 80px, 112px"
              className="object-contain filter drop-shadow-2xl"
              priority
            />
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-blue-200 uppercase tracking-[0.2em] font-bold text-xs md:text-sm mb-6 italic"
          >
            "To acknowledge the duty that accompanies every right."
          </motion.p>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-8 tracking-tight leading-tight"
          >
            Y's Men International<br />
            <span className="text-blue-400">South West India Region</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-gray-100 max-w-4xl mx-auto mb-12 leading-relaxed font-light"
          >
            A global fellowship of like-minded individuals partnering with the YMCA, dedicated to community service, 
            cultural exchange, and supporting one another in professional excellence.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col sm:flex-row justify-center gap-6"
          >
            <Link
              href="/directory"
              className="inline-flex items-center justify-center px-10 py-4 rounded-full text-white bg-red-600 hover:bg-red-700 text-lg font-bold transition-all shadow-xl hover:shadow-red-900/40 active:scale-95 uppercase tracking-wide"
            >
              Explore the Directory
            </Link>
            <Link
              href="/about/history"
              className="inline-flex items-center justify-center px-10 py-4 rounded-full text-white border-2 border-white/40 hover:border-white hover:bg-white/10 text-lg font-bold transition-all backdrop-blur-sm active:scale-95 uppercase tracking-wide"
            >
              Learn About Our Legacy
            </Link>
          </motion.div>
        </div>
      </section>

      {/* SWIR 2026-27 Regional Vision & Pillar Cards */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-blue-950 via-slate-950 to-blue-950 text-white relative border-b border-blue-900/60 overflow-hidden">
        {/* Background Ambient Glow Orbs */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <motion.span 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-400/10 text-amber-300 text-xs font-extrabold rounded-full border border-amber-400/30 uppercase tracking-widest shadow-inner"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Regional Direction 2026–27
            </motion.span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              Our Vision & Core Mandate
            </h2>
            <p className="text-gray-300 text-base md:text-lg font-light leading-relaxed">
              Guiding the South West India Region towards unity, economic empowering, and communal fellowship.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Card 1: Theme */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, scale: 1.01 }}
              transition={{ duration: 0.4 }}
              className="relative p-8 md:p-12 rounded-3xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-400/60 shadow-2xl hover:shadow-[0_0_35px_rgba(251,191,36,0.15)] backdrop-blur-md flex flex-col justify-center group transition-all duration-500 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-400/20 transition-all duration-500"></div>
              
              <div className="relative z-10 space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-inner">
                  <TrendingUp className="w-7 h-7" />
                </div>
                
                <div className="space-y-3">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Regional Theme</span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-400 leading-tight">
                    “Moving Forward Together for Success”
                  </h3>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Slogan */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, scale: 1.01 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative p-8 md:p-12 rounded-3xl bg-slate-900/90 border border-blue-500/30 hover:border-blue-400/60 shadow-2xl hover:shadow-[0_0_35px_rgba(56,189,248,0.15)] backdrop-blur-md flex flex-col justify-center group transition-all duration-500 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-400/20 transition-all duration-500"></div>

              <div className="relative z-10 space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-400/10 border border-blue-400/30 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shadow-inner">
                  <Users className="w-7 h-7" />
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-blue-400" />
                    <span>Regional Slogan</span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-blue-300 to-indigo-200 leading-tight">
                    “Let us Grow Together by Helping Each other”
                  </h3>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Step 2: Content Section 1 - The Movement & Legacy with Staggered Reveals */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
              className="space-y-8"
            >
              <motion.div variants={itemVariants} className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded uppercase tracking-widest">
                Our Foundation
              </motion.div>
              <motion.h2 variants={itemVariants} className="text-4xl font-black text-blue-950 tracking-tight leading-tight">
                A Century of Fellowship
              </motion.h2>
              <motion.p variants={itemVariants} className="text-xl text-gray-600 leading-relaxed font-light">
                Founded in 1922, Y's Men International operates in over 80 countries. As the acknowledged partner of the YMCA, 
                our movement strives to develop, encourage, and provide leadership to build a better world for all humankind.
              </motion.p>
              <motion.div variants={itemVariants} className="pt-4">
                <Link href="/about/philosophy" className="text-blue-600 font-bold hover:text-blue-800 flex items-center gap-2 group">
                  Explore our core philosophy
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats Grid with Staggered Item Entrance */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
              className="grid grid-cols-2 gap-6"
            >
              {[
                { label: "80+ Nations", icon: Globe, highlight: "Global Network" },
                { label: "100+ Years", icon: Clock, highlight: "Rich Heritage" },
                { label: "Dedicated", icon: Heart, highlight: "To Service" },
                { label: "Partnered", icon: Handshake, highlight: "With YMCA" },
              ].map((stat, i) => (
                <motion.div 
                  key={i} 
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, rotateZ: 1 }}
                  className="group p-5 md:p-8 bg-slate-50 rounded-2xl md:rounded-3xl border border-gray-100 hover:bg-blue-950 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-center"
                >
                  <stat.icon className="w-6 h-6 md:w-8 md:h-8 text-blue-600 mb-4 md:mb-6 group-hover:text-blue-400 transition-colors" />
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-950 group-hover:text-white mb-1 md:mb-2 tracking-tighter transition-colors break-words">
                    {stat.label}
                  </p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 group-hover:text-blue-200 font-medium uppercase tracking-wide transition-colors break-words line-clamp-2">
                    {stat.highlight}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Hydrated Server Component Slot */}
      {children}

      {/* Step 3: Content Section 2 - The Y's Men's International Marketplace with Reveal */}
      <section className="py-32 bg-slate-50 relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12"
        >
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-blue-950 tracking-tight">
              Strengthening Our Community Through Commerce
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto rounded-full"></div>
          </div>
          
          <p className="text-2xl text-gray-600 leading-relaxed font-light italic">
            "The SWIR Business Directory isn't just a list of companies. It is a commitment to our members. 
            By connecting trusted Y's Men professionals, we foster economic growth within our ranks, 
            ensuring that when our members succeed, our capacity to serve the community multiplies."
          </p>
          
          <div className="pt-8">
            <Link
              href="/directory"
              className="inline-flex items-center justify-center px-12 py-5 rounded-full text-white bg-blue-950 hover:bg-black text-xl font-bold transition-all shadow-2xl hover:scale-105 active:scale-95"
            >
              Access the Member Marketplace
            </Link>
          </div>
        </motion.div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/5 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2"></div>
      </section>
    </div>
  );
}

