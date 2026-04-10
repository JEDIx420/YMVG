"use client";

import { Users, HeartHandshake, Star, Globe } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: "circOut" as const } 
  },
} as const;

export default function PhilosophyPage() {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/* STEP 1: Mini-Hero Section */}
      <section 
        className="relative min-h-[50vh] flex items-center justify-center bg-cover bg-center"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=2070&auto=format&fit=crop')` 
        }}
      >
        <div className="absolute inset-0 bg-blue-950/80"></div>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative text-center px-4 max-w-7xl mx-auto py-24"
        >
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-4 leading-tight">
            Our Philosophy<br />
            <span className="text-blue-400">& Values</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 font-light italic">
            "Guided by fellowship, driven by service."
          </p>
        </motion.div>
      </section>

      {/* STEP 2: Core Mission Section */}
      <section className="bg-white py-24 px-4 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="max-w-3xl mx-auto text-center space-y-8"
        >
          <div className="inline-flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-0.5 bg-blue-900 rounded-full"></div>
            <h2 className="text-3xl font-black text-blue-950 tracking-tight uppercase">
              A Partnership with the YMCA
            </h2>
            <div className="w-12 h-0.5 bg-blue-900 rounded-full"></div>
          </div>
          
          <p className="text-xl text-gray-700 leading-relaxed font-light">
            Y's Men International is a worldwide fellowship of persons of all faiths working together in mutual respect and affection, 
            based on the teachings of Jesus Christ, and with a common loyalty to the Young Men's Christian Association (YMCA). 
            We strive through active service to develop, encourage and provide leadership to build a better world for all humankind.
          </p>
          
          <div className="pt-8">
            <div className="inline-block px-6 py-3 border-2 border-red-600/20 rounded-full text-red-600 font-bold text-sm uppercase tracking-widest">
              Est. 1922 • Serving Globally
            </div>
          </div>
        </motion.div>
      </section>

      {/* STEP 3: The Four Pillars Grid with Staggered Entrance */}
      <section className="bg-slate-50 py-24 px-4">
        <div className="max-w-7xl mx-auto space-y-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h3 className="text-sm font-bold text-red-600 uppercase tracking-[0.3em] mb-4">The Foundation</h3>
            <h2 className="text-4xl font-black text-blue-950 tracking-tight">Our Four Pillars of Engagement</h2>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { title: "Fellowship", icon: Users, desc: "Building lasting bonds of friendship and mutual support across local and international borders." },
              { title: "Service", icon: HeartHandshake, desc: "Acknowledging the duty that accompanies every right through dedicated community action." },
              { title: "Leadership", icon: Star, desc: "Developing and encouraging leaders to spearhead positive change in our communities." },
              { title: "International", icon: Globe, desc: "Fostering global citizenship, cultural exchange, and worldwide peace and understanding." },
            ].map((pillar, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -10 }}
                className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 hover:shadow-2xl transition-all duration-300"
              >
                <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
                  <pillar.icon className="w-8 h-8 text-red-600" />
                </div>
                <h4 className="text-xl font-bold text-blue-950 mb-4">{pillar.title}</h4>
                <p className="text-gray-600 leading-relaxed font-light">
                  {pillar.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* STEP 4: The Motto Banner with Scale Effect */}
      <section className="bg-blue-950 text-white py-32 text-center px-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-900/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative max-w-4xl mx-auto space-y-6"
        >
          <p className="text-blue-400 font-bold uppercase tracking-[0.2em] text-sm">Our Official Motto</p>
          <div className="h-0.5 w-16 bg-red-600 mx-auto"></div>
          <blockquote className="text-3xl md:text-5xl font-extralight italic leading-tight px-4">
            "To acknowledge the duty that accompanies every right."
          </blockquote>
        </motion.div>
      </section>
    </div>
  );
}
