"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import Image from "next/image";
import { History, Globe, Users, Cpu, Quote, Camera, Calendar, ShieldCheck, Anchor, Star } from "lucide-react";

const milestones = [
  {
    year: "1920",
    title: "The Tolymca Genesis",
    subtitle: "Toledo, Ohio",
    content: "The movement began as the 'Tolymca' luncheon club, a group of business and YMCA professionals led by Judge Paul William Alexander in Toledo, Ohio. This laid the foundation for what would become a worldwide fellowship.",
    icon: Calendar,
    image: "/history/tolymca_genesis_1920_1775833367377.png",
    fact: "Alexander's birthday, December 8, is now celebrated globally as Founder's Day."
  },
  {
    year: "1922",
    title: "International Charter",
    subtitle: "Atlantic City Convention",
    content: "The International Association of Y's Men's Clubs was officially established during the triennial convention of the YMCA in Atlantic City. Judge Paul William Alexander was elected as the first International President.",
    icon: ShieldCheck,
    image: "/history/founder_real.jpg",
    fact: "The organization was built to unite ordinary people in fellowship to achieve 'extraordinary good'."
  },
  {
    year: "1924",
    title: "Global Outreach",
    subtitle: "Expansion to Shanghai",
    content: "The movement officially became Y's Men International as it expanded beyond North America. The first club outside the US and Canada was formed in Shanghai, China, marking the beginning of our global footprint.",
    icon: Globe,
    image: "/history/shanghai_expansion_1924_1775833399952.png",
    fact: "By 1924, the fellowship had already reached across three continents."
  },
  {
    year: "1931",
    title: "The Asia Charter",
    subtitle: "Colombo, India-Ceylon region",
    content: "The spirit of Y's Men reached the Asian sub-continent with the chartering of the first club in Colombo. This sparked a rapid interest across major Indian cities, setting the stage for one of the most active Areas in the world.",
    icon: Anchor,
    image: "/history/colombo_charter_1931_1775833418049.png",
    fact: "The India-Ceylon region eventually evolved into the massive India Area we know today."
  },
  {
    year: "1983",
    title: "The India Era",
    subtitle: "Inauguration of India Area",
    content: "The India Area was formally inaugurated as a separate administrative entity of Y's Men International. Dr. P. Sukumaran served as the first Area President, ushering in a period of unprecedented local growth.",
    icon: Users,
    image: "/history/india_area_1983_1775833434404.png",
    fact: "Dr. P. Sukumaran was a visionary leader who solidified the movement's presence in the sub-continent."
  },
  {
    year: "2000",
    title: "Regional Strength",
    subtitle: "Trivandrum Headquarters",
    content: "A permanent headquarters for the India Area was established in Trivandrum, Kerala. This solidified the South West India Region's role as a central hub for administrative and community service activities.",
    icon: History,
    image: "/history/trivandrum_hq_2000_1775833457212.png",
    fact: "The Trivandrum HQ today serves as the nerve center for thousands of Y's Men and Women."
  },
  {
    year: "2022",
    title: "Centennial Jubilee",
    subtitle: "100 Years of Service",
    content: "Y's Men International celebrated its 100th anniversary. From a single club in Toledo to a global movement in 70+ countries, the centennial honored the legacy of Judge Paul William Alexander.",
    icon: Star,
    image: "/history/centennial_jubilee_2022_1775833477139.png",
    fact: "The centennial convention was held in Toledo, returning to the organization's roots."
  },
  {
    year: "2024",
    title: "The Digital Leap",
    subtitle: "AI Directory Launch",
    content: "The South West India Region embraced the digital future with the launch of the AI-powered Business Directory and Digital Platform, connecting members with cutting-edge technology.",
    icon: Cpu,
    image: "/history/digital_leap_2024_1775833498601.png",
    fact: "The platform represents the region's commitment to modernizing fellowship and business networking."
  },
  {
    year: "2026",
    title: "Future Horizons",
    subtitle: "Expanding the Global Ecosystem",
    content: "Looking forward to 2026, Y's Men's International SWIR envisions a fully integrated global digital ecosystem, bridging the gap between local service and international professional opportunities for all members.",
    icon: Globe,
    image: "/history/future_horizons_2026_1775833514931.png",
    fact: "The future focus is on sustainable impact and hyper-connected global community projects."
  }
];

export default function HistoryPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end end"]
  });

  const lineHeight = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans overflow-hidden">
      {/* 1. The Hero: A Century of Service */}
      <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
        <Image 
          src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2076&auto=format&fit=crop"
          alt="Historical Context"
          fill
          sizes="100vw"
          className="object-cover sepia-[0.5] contrast-[1.1] grayscale-[0.2]"
          priority
        />
        <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-[2px]"></div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "circOut" }}
            className="space-y-6"
          >
            <h1 className="text-sm font-black text-red-500 uppercase tracking-[0.4em]">Establishing a Legacy</h1>
            <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none uppercase">
              A CENTURY <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">OF SERVICE</span>
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 font-serif italic max-w-2xl mx-auto opacity-80">
              Our Heritage: From the first meeting in 1922 to a global movement today.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 2. Pull Quote Section */}
      <section className="bg-white py-32 px-4 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Quote className="w-12 h-12 text-red-600/20 mx-auto" />
          <motion.blockquote 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-serif italic text-blue-950 leading-relaxed"
          >
            "Ours is a movement of fellowship, of duty, and of an unyielding commitment to see every person achieve their God-given potential through the service we provide."
          </motion.blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-slate-200"></div>
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">Judge Paul William Alexander, Founder</p>
            <div className="h-px w-12 bg-slate-200"></div>
          </div>
        </div>
      </section>

      {/* 3. The Interactive Timeline */}
      <section ref={containerRef} className="relative bg-slate-50 py-32 px-4 scroll-mt-20">
        <div className="max-w-7xl mx-auto relative">
          
          {/* Central Vertical Line (Self-Drawing) */}
          <div className="absolute left-1/2 -translate-x-1/2 h-full w-[2px] bg-slate-200 hidden md:block">
            <motion.div 
              style={{ scaleY: lineHeight, transformOrigin: "top" }}
              className="w-full h-full bg-red-600"
            />
          </div>

          {/* Timeline Nodes */}
          <div className="space-y-32">
            {milestones.map((milestone, index) => {
              const isEven = index % 2 === 0;
              return (
                <div key={milestone.year} className="relative">
                  {/* Floating Date Indicator */}
                  <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-1/2 z-20 hidden md:block">
                    <motion.div 
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      className="w-16 h-16 bg-white border-2 border-red-600 rounded-full flex items-center justify-center shadow-xl cursor-default group"
                    >
                      <span className="text-xs font-black text-blue-950 group-hover:text-red-600 transition-colors uppercase">{milestone.year}</span>
                      {/* Tooltip Content */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 p-3 bg-blue-950 text-white text-[10px] rounded-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none shadow-2xl">
                        <div className="font-black text-red-400 mb-1 tracking-tighter uppercase">Historical Fact</div>
                        {milestone.fact}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-blue-950"></div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Node Content */}
                  <div className={`flex flex-col md:flex-row items-center justify-between gap-12 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                    {/* Content Card */}
                    <motion.div 
                      initial={{ opacity: 0, x: isEven ? -50 : 50, scale: 0.8 }}
                      whileInView={{ opacity: 1, x: 0, scale: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: "circOut" }}
                      className="w-full md:w-[45%] bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-2xl transition-all group"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                          <milestone.icon className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-black text-red-600 md:hidden">{milestone.year}</span>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-3xl font-black text-blue-950 tracking-tight uppercase leading-tight">
                          {milestone.title}
                        </h3>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{milestone.subtitle}</p>
                        <p className="text-lg text-slate-600 leading-relaxed font-light">
                          {milestone.content}
                        </p>
                      </div>

                      <button className="mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-950 hover:text-red-600 transition-colors">
                        <Camera className="w-4 h-4" />
                        View Archive Photos
                      </button>
                    </motion.div>

                    {/* Image/Visual Placeholder */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 1 }}
                      className="w-full md:w-[45%] aspect-video md:aspect-[4/3] relative rounded-[40px] overflow-hidden shadow-xl"
                    >
                      <Image 
                        src={milestone.image}
                        alt={milestone.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 45vw"
                        className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
                      />
                      <div className="absolute inset-0 bg-blue-950/20 group-hover:bg-transparent transition-all"></div>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Final CTA: Legacy */}
      <section className="bg-blue-950 py-32 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -ml-48 -mb-48"></div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center space-y-8 relative z-10"
        >
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none uppercase">
            CARRYING THE <br />
            <span className="text-red-500">TORCH FORWARD</span>
          </h2>
          <p className="text-xl text-blue-200 font-light max-w-2xl mx-auto leading-relaxed">
            Our history is still being written. We invite you to join the South West India Region and add your chapter to our century-long story.
          </p>
          <div className="pt-8">
            <a 
              href="https://www.ysmen.org/join-us/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-12 py-5 bg-white text-blue-950 rounded-full font-black text-lg transition-all hover:bg-red-600 hover:text-white shadow-2xl"
            >
              Join the Movement
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
