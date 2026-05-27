"use client";

import { Users, HeartHandshake, ShieldCheck, Globe, ArrowRight, History, Anchor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

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
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
  },
} as const;

const pillars = [
  { 
    id: "duty",
    title: "Duty", 
    subtitle: "The Foundation",
    icon: ShieldCheck, 
    desc: "To acknowledge the duty that accompanies every right.",
    details: "Our core ethos lies in taking responsibility for our world. Every privilege we enjoy is a call to action for the less fortunate."
  },
  { 
    id: "service",
    title: "Service", 
    subtitle: "The Mission",
    icon: HeartHandshake, 
    desc: "Active improvement of our local and global communities.",
    details: "We don't just talk about change; we implement it. Through various community service projects, we bring light where it is needed."
  },
  { 
    id: "fellowship",
    title: "Fellowship", 
    subtitle: "The Bond",
    icon: Users, 
    desc: "A worldwide network of friendship and mutual support.",
    details: "We are more than an organization; we are a family. Members across the globe share a bond of brotherhood and shared purpose."
  },
  { 
    id: "peace",
    title: "International Peace", 
    subtitle: "The Vision",
    icon: Globe, 
    desc: "Fostering cultural exchange and global understanding.",
    details: "By building bridges between diverse cultures, we lay the groundwork for a world united in peace and mutual respect."
  },
];

export default function PhilosophyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 1. Immersive Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <Image 
          src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop"
          alt="Philosophy Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/90 via-blue-950/70 to-white"></div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "circOut" }}
          >
            <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter mb-8 leading-none">
              OUR <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-red-500">PHILOSOPHY</span>
            </h1>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100px" }}
              transition={{ delay: 0.5, duration: 1 }}
              className="h-1 bg-red-600 mx-auto mb-8 rounded-full"
            />
            <p className="text-xl md:text-3xl text-blue-100 font-light italic leading-relaxed tracking-tight max-w-3xl mx-auto">
              "To acknowledge the duty that accompanies every right."
            </p>
          </motion.div>
        </div>
      </section>

      {/* 2. Interactive Pillars Grid */}
      <section className="relative z-20 -mt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-32">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {pillars.map((pillar) => (
            <motion.div 
              key={pillar.id}
              variants={itemVariants}
              whileHover={{ y: -10 }}
              className="group relative h-[400px] overflow-hidden rounded-3xl cursor-default"
            >
              {/* Glassmorphism Background */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 group-hover:bg-blue-950/90 group-hover:backdrop-blur-none group-hover:border-blue-950"></div>
              
              <div className="relative h-full p-8 flex flex-col items-center text-center justify-center space-y-6">
                <div className="p-4 rounded-2xl bg-red-600/10 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors duration-500">
                  <pillar.icon className="w-10 h-10" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">{pillar.subtitle}</p>
                  <h3 className="text-2xl font-black text-blue-950 group-hover:text-white transition-colors duration-500">{pillar.title}</h3>
                </div>

                <p className="text-slate-600 font-medium group-hover:opacity-0 transition-opacity duration-300">
                  {pillar.desc}
                </p>

                {/* Hidden Details Overlay */}
                <div className="absolute inset-x-8 bottom-12 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
                  <p className="text-blue-100 text-sm leading-relaxed font-light italic">
                    {pillar.details}
                  </p>
                  <div className="mt-6 flex justify-center">
                    <span className="text-[10px] uppercase font-black tracking-widest text-red-400">Pillar {pillars.indexOf(pillar) + 1}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 3. Historical Context Section (Serif) */}
      <section className="bg-slate-50 py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative aspect-square lg:aspect-video rounded-3xl overflow-hidden shadow-2xl"
            >
              <Image 
                src="https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=2070&auto=format&fit=crop"
                alt="Heritage"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-blue-950/20"></div>
              <div className="absolute bottom-10 left-10 text-white">
                <p className="text-4xl font-serif">Est. 1922</p>
                <p className="text-xs font-black uppercase tracking-widest text-red-400">The Beginning of a Legacy</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 text-red-600">
                <History className="w-8 h-8" />
                <span className="text-sm font-black uppercase tracking-[0.3em]">Historical Roots</span>
              </div>
              
              <h2 className="text-5xl md:text-6xl font-serif text-blue-950 leading-tight">
                An Indestructible Bond with the <span className="italic text-slate-400">YMCA</span>
              </h2>
              
              <div className="space-y-6 text-lg text-slate-700 font-serif leading-relaxed italic">
                <p>
                  The story of Y's Men International began in 1922, in Toledo, Ohio, USA. What started as a local service club of the YMCA blossomed into a worldwide movement of persons of all faiths.
                </p>
                <p>
                  Based on the teachings of Jesus Christ and a common loyalty to the Young Men's Christian Association, our movement was built to support the YMCA's mission while forging an independent path of community service and leadership development.
                </p>
              </div>

              <div className="pt-8">
                <div className="inline-flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                  <div className="p-3 bg-red-50 rounded-xl text-red-600">
                    <Anchor className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-blue-950 font-bold max-w-xs">
                    Rooted in Toledo, Ohio. Growing across 70+ countries today.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. The Call to Action */}
      <section className="bg-white py-32 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-slate-200 to-transparent"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center space-y-12"
        >
          <div className="space-y-4">
            <h2 className="text-5xl md:text-7xl font-black text-blue-950 tracking-tighter uppercase leading-none">
              BECOME A PART <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400 font-black">OF THE LEGACY</span>
            </h2>
            <p className="text-xl text-slate-500 font-light max-w-2xl mx-auto">
              Join a global fellowship dedicated to service, leadership, and community improvement. Find a club near you in the South West India Region.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              href="/directory"
              className="w-full sm:w-auto px-12 py-5 bg-blue-950 hover:bg-black text-white rounded-full font-black text-lg transition-all shadow-2xl flex items-center justify-center gap-3 group"
            >
              Find a Club
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
            <a 
              href="https://www.ysmen.org" 
              target="_blank"
              className="w-full sm:w-auto px-12 py-5 bg-slate-100 hover:bg-slate-200 text-blue-950 rounded-full font-black text-lg transition-all flex items-center justify-center"
            >
              Global Y's Men's International Site
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
