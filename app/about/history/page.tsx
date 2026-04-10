"use client";

import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.8, ease: "circOut" as const } 
  },
} as const;

const itemVariantsRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.8, ease: "circOut" as const } 
  },
} as const;

export default function HistoryPage() {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/* STEP 1: Mini-Hero Section */}
      <section 
        className="relative min-h-[40vh] flex items-center justify-center bg-cover bg-center"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')` 
        }}
      >
        <div className="absolute inset-0 bg-blue-950/80"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative text-center px-4 max-w-7xl mx-auto py-20"
        >
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-4 leading-tight">
            Our History
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 font-light italic">
            "A century of fellowship, born in 1922."
          </p>
        </motion.div>
      </section>

      {/* STEP 2: The Origin Story */}
      <section className="bg-white py-24 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="max-w-3xl mx-auto text-center space-y-8"
        >
          <div className="inline-flex items-center justify-center mb-6">
            <div className="w-12 h-1 bg-red-600 rounded-full"></div>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-blue-950 tracking-tight leading-tight">
            The Vision of Paul William Alexander
          </h2>
          <p className="text-xl text-gray-700 leading-relaxed font-light">
            In 1922, a group of young men in Toledo, Ohio, formed a club to support their local YMCA. 
            Led by Judge Paul William Alexander, the 'Y's Men' rapidly expanded from a single luncheon club into an international movement. 
            Today, Y's Men International spans across continents, yet remains firmly rooted in its original mission: 
            to serve the YMCA and the broader community.
          </p>
        </motion.div>
      </section>

      {/* STEP 3: Vertical Timeline UI with Staggered Nodes */}
      <section className="bg-slate-50 py-24 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20 space-y-4"
          >
            <h2 className="text-4xl font-black text-blue-950 tracking-tight">Timeline of Impact</h2>
            <p className="text-gray-500 font-medium uppercase tracking-widest text-sm">Tracing our roots across the globe</p>
          </motion.div>

          <div className="relative px-6 pb-20">
            {/* Central Vertical Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-slate-200"></div>

            {/* Timeline Nodes */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
              className="space-y-24"
            >
              {/* 1922 */}
              <motion.div variants={itemVariants} className="relative">
                <div className="absolute left-1/2 transform -translate-x-1/2 -top-2 w-6 h-6 bg-red-600 rounded-full border-4 border-white shadow-sm z-10"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="md:text-right">
                    <span className="text-5xl font-black text-blue-950/10">1922</span>
                    <h3 className="text-2xl font-bold text-blue-950 mt-2">The Founding</h3>
                  </div>
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 md:ml-4">
                    <p className="text-gray-600 leading-relaxed">
                      Founded in Toledo, Ohio by Paul William Alexander, establishing a club dedicated to supporting the focal point of the community: the YMCA.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* 1924 */}
              <motion.div variants={itemVariantsRight} className="relative">
                <div className="absolute left-1/2 transform -translate-x-1/2 -top-2 w-6 h-6 bg-red-600 rounded-full border-4 border-white shadow-sm z-10"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="md:order-2">
                    <span className="text-5xl font-black text-blue-950/10">1924</span>
                    <h3 className="text-2xl font-bold text-blue-950 mt-2">Going Global</h3>
                  </div>
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 md:mr-4 md:text-right md:order-1">
                    <p className="text-gray-600 leading-relaxed">
                      The movement officially becomes Y's Men International, expanding beyond US borders to foster fellowship and service on a global scale.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Present Day */}
              <motion.div variants={itemVariants} className="relative">
                <div className="absolute left-1/2 transform -translate-x-1/2 -top-2 w-6 h-6 bg-red-600 rounded-full border-4 border-white shadow-sm z-10"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="md:text-right">
                    <span className="text-5xl font-black text-blue-950/10">Today</span>
                    <h3 className="text-2xl font-bold text-blue-950 mt-2">South West India Region</h3>
                  </div>
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 md:ml-4">
                    <p className="text-gray-600 leading-relaxed">
                      The SWIR stands as a vibrant, rapidly growing pillar of the international movement, driving massive community impact and professional networking.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STEP 4: The YMCA Partnership Block */}
      <section className="bg-white py-24 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-12 text-center shadow-sm">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 p-4 rounded-2xl">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-blue-950 mb-6 tracking-tight">
              The Acknowledged Partner of the YMCA
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              While we operate as an independent organization, Y's Men International is the officially recognized partner of the YMCA, 
              working hand-in-hand to fund projects, build youth programs, and support community centers worldwide.
            </p>
            <div className="mt-10">
              <a 
                href="https://ymca.int" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 font-bold hover:text-blue-800 transition-colors uppercase tracking-widest text-xs"
              >
                Learn about the Global YMCA
                <svg className="ml-2 w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
