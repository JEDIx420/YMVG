"use client";

import { useRef } from "react";
import Link from "next/link";
import { Globe, Clock, Heart, Handshake } from "lucide-react";
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

export default function LandingPage() {
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
        className="relative min-h-[85vh] flex items-center justify-center overflow-hidden" 
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
        <div className="absolute inset-0 bg-blue-950/80 mix-blend-multiply"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-24">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-blue-200 uppercase tracking-[0.2em] font-bold text-sm mb-6 italic"
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
                Founded in 1922, Y's Men International operates in over 70 countries. As the acknowledged partner of the YMCA, 
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
                { label: "70+ Nations", icon: Globe, highlight: "Global Network" },
                { label: "100+ Years", icon: Clock, highlight: "Rich Heritage" },
                { label: "Dedicated", icon: Heart, highlight: "To Service" },
                { label: "Partnered", icon: Handshake, highlight: "With YMCA" },
              ].map((stat, i) => (
                <motion.div 
                  key={i} 
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, rotateZ: 1 }}
                  className="group p-8 bg-slate-50 rounded-3xl border border-gray-100 hover:bg-blue-950 transition-all duration-300 shadow-sm hover:shadow-xl"
                >
                  <stat.icon className="w-8 h-8 text-blue-600 mb-6 group-hover:text-blue-400 transition-colors" />
                  <p className="text-3xl font-black text-blue-950 group-hover:text-white mb-2 tracking-tighter transition-colors">
                    {stat.label}
                  </p>
                  <p className="text-sm text-gray-500 group-hover:text-blue-200 font-medium uppercase tracking-wide transition-colors">
                    {stat.highlight}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Step 3: Content Section 2 - The YMI Marketplace with Reveal */}
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
