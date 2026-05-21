"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Mail, Phone, MapPin, Award, Copy, Check, Shield } from "lucide-react";
import { useState } from "react";

// Types
interface Leader {
  name: string;
  designation: string;
  district: string;
  phone: string;
  email: string;
  image: string;
  bio?: string;
  objectPosition?: string;
}

// Ordered exactly as shown in namepositionmatrix.jpg
const leadersData: Leader[] = [
  {
    name: "Ym. Er. J. Jayakumar",
    designation: "Regional Director",
    district: "D2",
    phone: "9447022244",
    email: "jktrivandrum@gmail.com",
    image: "/directoryimages/jayakumar.jpeg",
    bio: "Leading the South West India Region with visionary governance, fostering international fellowship, and strengthening local YMCA partnerships.",
    objectPosition: "50% 12%"
  },
  {
    name: "Ym. Vinod Rajasekhar",
    designation: "Regional Secretary",
    district: "D4",
    phone: "9562808170",
    email: "vinodsekhar@gmail.com",
    image: "/directoryimages/vinodsir.jpeg",
    bio: "Managing regional operations, records, and coordination among the various districts and clubs in SWIR.",
    objectPosition: "50% 10%"
  },
  {
    name: "Ym. Prasanth Frederick",
    designation: "Regional Treasurer",
    district: "D2",
    phone: "9447036758",
    email: "prasanthnf@gmail.com",
    image: "/directoryimages/prashanthsir.jpeg",
    bio: "Ensuring financial accountability, budget planning, and transparency across all regional projects and initiatives.",
    objectPosition: "50% 10%"
  },
  {
    name: "Ym. Adv. Dr. Vineeth Kumar",
    designation: "Regional Bulletin Editor",
    district: "D3",
    phone: "7907437020",
    email: "advvsvk@gmail.com",
    image: "/directoryimages/vineethsir.jpeg",
    bio: "Documenting achievements, publishing the regional newsletter, and highlighting the impactful service of our clubs.",
    objectPosition: "50% 12%"
  },
  {
    name: "Ym. Rajakumar",
    designation: "Regional Y's Guy",
    district: "D1",
    phone: "9443682355",
    email: "starkrkumar@gmail.com",
    image: "/directoryimages/rajakumar.jpeg",
    bio: "Fostering youth activities, fellowship engagement, and regional spirit across SWIR communities.",
    objectPosition: "50% 10%"
  },
  {
    name: "Yw. Bindya",
    designation: "Office Coordinator",
    district: "D2",
    phone: "9037118890",
    email: "bindhyakurup@gmail.com",
    image: "/directoryimages/bindhyamaam.jpeg",
    bio: "Streamlining regional headquarters administration, coordinating scheduling, and supporting executive communication.",
    objectPosition: "50% 12%"
  }
];

// Split the leader list into Regional Director and Cabinet
const regionalDirector = leadersData[0];
const cabinetMembers = leadersData.slice(1);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
} as const;

export default function LeadershipPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans pb-24">
      {/* 1. Header Banner */}
      <section className="relative bg-blue-950 py-20 px-4 text-center overflow-hidden border-b border-blue-900">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -ml-32 -mb-32"></div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-800 text-blue-300 text-xs font-semibold tracking-wider uppercase"
          >
            <Shield className="w-3.5 h-3.5 text-red-500" />
            SWIR Cabinet 2026 - 2027
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight"
          >
            REGIONAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">LEADERSHIP</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-blue-100/80 font-light max-w-2xl mx-auto leading-relaxed"
          >
            Meet the dedicated cabinet members leading Y's Men International in the South West India Region, committed to fellowship, duty, and community service.
          </motion.p>
        </div>
      </section>

      {/* 2. Spotlight: Regional Director */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center mb-8">
          <h2 className="text-xs font-black tracking-[0.2em] text-red-600 uppercase">Executive Officer</h2>
          <div className="w-12 h-1 bg-red-600 mx-auto mt-2 rounded-full"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative max-w-4xl mx-auto bg-white rounded-[32px] shadow-lg border border-slate-100 overflow-hidden hover:shadow-2xl transition-shadow duration-500"
        >
          {/* Decorative Corner Gradient */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-600/10 to-transparent pointer-events-none rounded-bl-full"></div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center p-8 md:p-12">
            {/* Image container */}
            <div className="md:col-span-5 flex justify-center">
              <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-2xl overflow-hidden shadow-md border-4 border-slate-50 group bg-slate-100">
                <Image
                  src={regionalDirector.image}
                  alt={regionalDirector.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ objectPosition: regionalDirector.objectPosition || "50% 20%" }}
                  priority
                />
              </div>
            </div>

            {/* Leader Info */}
            <div className="md:col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wider">
                    <Award className="w-3.5 h-3.5" />
                    {regionalDirector.designation}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                    District {regionalDirector.district}
                  </span>
                </div>
                <h3 className="text-3xl md:text-4xl font-extrabold text-blue-950 tracking-tight">
                  {regionalDirector.name}
                </h3>
              </div>

              <p className="text-slate-600 text-lg leading-relaxed font-light italic">
                "{regionalDirector.bio}"
              </p>

              <div className="h-px bg-slate-100 my-4"></div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={`tel:${regionalDirector.phone}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 rounded-xl bg-blue-950 text-white font-medium hover:bg-black transition-all shadow-md active:scale-95 group"
                >
                  <span className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                    +91 {regionalDirector.phone}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleCopy(regionalDirector.phone, 'rd-phone');
                    }}
                    className="p-1 hover:bg-white/10 rounded-md transition-colors"
                    title="Copy Phone"
                  >
                    {copiedId === 'rd-phone' ? (
                      <Check className="w-4 h-4 text-green-400 animate-scale" />
                    ) : (
                      <Copy className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                    )}
                  </button>
                </a>

                <a
                  href={`mailto:${regionalDirector.email}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-all shadow-sm active:scale-95 group"
                >
                  <span className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                    {regionalDirector.email}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleCopy(regionalDirector.email, 'rd-email');
                    }}
                    className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                    title="Copy Email"
                  >
                    {copiedId === 'rd-email' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </button>
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3. Cabinet Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="text-center mb-12">
          <h2 className="text-xs font-black tracking-[0.2em] text-red-600 uppercase">Regional Cabinet</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-blue-950 tracking-tight mt-2">
            Cabinet Officers & Coordinators
          </h3>
          <div className="w-12 h-1 bg-red-600 mx-auto mt-3 rounded-full"></div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {cabinetMembers.map((member, idx) => {
            const memberId = `member-${idx}`;
            return (
              <motion.div
                key={member.name}
                variants={cardVariants}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group h-full"
              >
                {/* Visual Header / Avatar Container */}
                <div className="relative h-72 w-full bg-slate-100 overflow-hidden">
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      style={{ objectPosition: member.objectPosition || "50% 20%" }}
                    />
                  ) : (
                    // Elegant fallback for members without photo (e.g. Ym. Rajakumar)
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-950 to-blue-900 text-white">
                      <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-3">
                        <Award className="w-10 h-10 text-red-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-blue-300">
                        {member.designation}
                      </span>
                    </div>
                  )}
                  {/* District tag float */}
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-sm text-blue-900 font-bold text-xs shadow-sm uppercase">
                      Dist: {member.district}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 flex flex-col justify-between flex-grow space-y-6">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-red-600 block">
                        {member.designation}
                      </span>
                      <h4 className="text-xl font-bold text-blue-950 tracking-tight line-clamp-1">
                        {member.name}
                      </h4>
                    </div>

                    <p className="text-slate-500 text-sm leading-relaxed font-light line-clamp-3">
                      {member.bio}
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-50">
                    {/* Phone line */}
                    <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100/60 hover:bg-slate-100 hover:border-slate-200 transition-colors">
                      <a href={`tel:${member.phone}`} className="flex items-center gap-2 font-medium">
                        <Phone className="w-3.5 h-3.5 text-red-500" />
                        <span>+91 {member.phone}</span>
                      </a>
                      <button
                        onClick={() => handleCopy(member.phone, `${memberId}-phone`)}
                        className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-400 hover:text-slate-600"
                        title="Copy Phone"
                      >
                        {copiedId === `${memberId}-phone` ? (
                          <Check className="w-3.5 h-3.5 text-green-600 animate-scale" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Email line */}
                    <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100/60 hover:bg-slate-100 hover:border-slate-200 transition-colors">
                      <a href={`mailto:${member.email}`} className="flex items-center gap-2 font-medium truncate max-w-[80%]">
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        <span className="truncate">{member.email}</span>
                      </a>
                      <button
                        onClick={() => handleCopy(member.email, `${memberId}-email`)}
                        className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-400 hover:text-slate-600"
                        title="Copy Email"
                      >
                        {copiedId === `${memberId}-email` ? (
                          <Check className="w-3.5 h-3.5 text-green-600 animate-scale" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* 4. Footer CTA */}
      <section className="max-w-4xl mx-auto px-4 text-center mt-28">
        <div className="p-8 md:p-12 rounded-[40px] bg-gradient-to-br from-blue-950 to-blue-900 text-white relative overflow-hidden shadow-xl border border-blue-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="relative z-10 space-y-6">
            <h3 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">
              Questions or Support?
            </h3>
            <p className="text-blue-100/80 text-base md:text-lg max-w-xl mx-auto font-light">
              For any administrative inquiries, regional documentation, or coordination requests, reach out directly to our regional cabinet secretary or office coordinator.
            </p>
            <div className="pt-4 flex justify-center gap-4 flex-wrap">
              <a
                href={`mailto:${leadersData[1].email}`}
                className="px-6 py-3 bg-red-600 text-white hover:bg-red-700 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Contact Secretary
              </a>
              <a
                href={`tel:${leadersData[5].phone}`}
                className="px-6 py-3 bg-white/10 text-white border border-white/20 hover:bg-white/20 rounded-full font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Call Headquarters
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
