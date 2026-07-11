"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { updatePersonalProfile } from "@/app/actions/profiles";
import { 
  Loader2, 
  User, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Shield, 
  Hash, 
  Landmark, 
  Globe,
  Home,
  Briefcase,
  GraduationCap,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Profile } from "@/types/database.types";

const personalProfileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters."),
  phone: z.string().min(5, "Please enter a valid phone number."),
  imis_id: z.string().nullable().optional(),
  ym_region: z.string().nullable().optional(),
  ym_district: z.string().nullable().optional(),
  ym_zone: z.string().nullable().optional(),
  ym_club: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  education: z.string().nullable().optional(),
  job_title: z.string().nullable().optional(),
});

type PersonalProfileFormValues = z.infer<typeof personalProfileSchema>;

interface PersonalProfileFormProps {
  profile: Profile;
  linkedBusinesses: {
    id: string;
    brand_name: string | null;
    category: string | null;
    logo_url: string | null;
    sponsorship_tier: number | null;
  }[];
}

export default function PersonalProfileForm({ profile, linkedBusinesses }: PersonalProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalProfileFormValues>({
    resolver: zodResolver(personalProfileSchema),
    defaultValues: {
      full_name: profile.full_name || "",
      phone: profile.phone || "",
      imis_id: profile.imis_id || "",
      ym_region: profile.ym_region || "",
      ym_district: profile.ym_district || "",
      ym_zone: profile.ym_zone || "",
      ym_club: profile.ym_club || "",
      address: profile.address || "",
      city: profile.city || "",
      state: profile.state || "",
      country: profile.country || "",
      education: profile.education || "",
      job_title: profile.job_title || "",
    },
  });

  const onSubmit = async (data: PersonalProfileFormValues) => {
    setIsSubmitting(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append("full_name", data.full_name);
      formData.append("phone", data.phone);
      if (data.imis_id) formData.append("imis_id", data.imis_id);
      if (data.ym_region) formData.append("ym_region", data.ym_region);
      if (data.ym_district) formData.append("ym_district", data.ym_district);
      if (data.ym_zone) formData.append("ym_zone", data.ym_zone);
      if (data.ym_club) formData.append("ym_club", data.ym_club);
      if (data.address) formData.append("address", data.address);
      if (data.city) formData.append("city", data.city);
      if (data.state) formData.append("state", data.state);
      if (data.country) formData.append("country", data.country);
      if (data.education) formData.append("education", data.education);
      if (data.job_title) formData.append("job_title", data.job_title);

      const result = await updatePersonalProfile(formData);

      if (!result.success) {
        throw new Error(result.error || "Failed to update profile.");
      }

      setStatus({ type: "success", message: "Personal profile updated successfully!" });
      router.refresh();
    } catch (error: any) {
      console.error(error);
      setStatus({ type: "error", message: error.message || "Failed to update profile." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 rounded-2xl flex items-center gap-3 border ${
              status.type === "success" 
                ? "bg-emerald-950/80 border-emerald-800 text-emerald-300" 
                : "bg-rose-950/80 border-rose-800 text-rose-300"
            } backdrop-blur-md`}
          >
            {status.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            )}
            <span className="font-semibold text-sm">{status.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Core Identity Card (Read-only section) */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-xl rounded-3xl p-6 md:p-8 space-y-6 text-white">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest block border-b border-slate-800 pb-3">
            System Identity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Registered Email</label>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-800/80 bg-slate-950/60 text-slate-400 font-semibold cursor-not-allowed text-sm">
                <User className="w-4 h-4 shrink-0 text-slate-500" />
                <span>{profile.email}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Security Role</label>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-800/80 bg-slate-955/60 bg-slate-950/60 text-slate-400 font-semibold cursor-not-allowed text-sm uppercase tracking-wide">
                <Shield className="w-4 h-4 shrink-0 text-slate-500" />
                <span>{profile.app_role.replace("_", " ")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details (Editable section) */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800/80 shadow-2xl rounded-3xl p-6 md:p-8 space-y-6 text-white">
          <h3 className="text-sm font-black text-blue-300 uppercase tracking-widest block border-b border-slate-800 pb-3">
            Personal Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-200 uppercase tracking-wider block">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  {...register("full_name")}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-slate-950/50 hover:bg-slate-950/80 focus:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-semibold transition-all text-slate-100 placeholder:text-slate-600 ${
                    errors.full_name ? "border-rose-500 focus:border-rose-600 focus:ring-rose-500/10" : "border-slate-800"
                  }`}
                />
              </div>
              {errors.full_name && (
                <p className="text-xs text-rose-400 font-bold">{errors.full_name.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-200 uppercase tracking-wider block">Phone Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="Enter contact number"
                  {...register("phone")}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-slate-950/50 hover:bg-slate-950/80 focus:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-semibold transition-all text-slate-100 placeholder:text-slate-600 ${
                    errors.phone ? "border-rose-500 focus:border-rose-600 focus:ring-rose-500/10" : "border-slate-800"
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-rose-400 font-bold">{errors.phone.message}</p>
              )}
            </div>

            {/* IMIS ID */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-200 uppercase tracking-wider block">IMIS ID</label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. YMI-12345"
                  {...register("imis_id")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-950/80 focus:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-semibold transition-all text-slate-100 placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Y's Men Club */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-200 uppercase tracking-wider block">Y's Men Club</label>
              <div className="relative">
                <Landmark className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter club affiliation"
                  {...register("ym_club")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-950/80 focus:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-semibold transition-all text-slate-100 placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Region */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-200 uppercase tracking-wider block">Region</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. SWIR"
                  {...register("ym_region")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-950/80 focus:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-semibold transition-all text-slate-100 placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* District */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-200 uppercase tracking-wider block">District</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. District I"
                  {...register("ym_district")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-950/80 focus:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-semibold transition-all text-slate-100 placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Zone */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-200 uppercase tracking-wider block">Zone</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Zone A"
                  {...register("ym_zone")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-950/80 focus:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-semibold transition-all text-slate-100 placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Residential & Communication Address Section */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800/80 shadow-2xl rounded-3xl p-6 md:p-8 space-y-6 text-white">
          <h3 className="text-sm font-black text-blue-300 uppercase tracking-widest block border-b border-slate-800 pb-3">
            Residential & Communication Address
          </h3>

          <div className="space-y-6">
            {/* Address / Street Details */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-200 uppercase tracking-wider block">Address / Street Details</label>
              <div className="relative">
                <Home className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter street address, building, etc."
                  {...register("address")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-950/80 focus:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-semibold transition-all text-slate-100 placeholder:text-slate-600"
                  autoComplete="street-address"
                />
              </div>
            </div>

            {/* City, State, Country responsive grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* City */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-200 uppercase tracking-wider block">City</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Enter city"
                    {...register("city")}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-955/50 bg-slate-950/50 hover:bg-slate-950/80 focus:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-semibold transition-all text-slate-100 placeholder:text-slate-600"
                    autoComplete="address-level2"
                  />
                </div>
              </div>

              {/* State */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-200 uppercase tracking-wider block">State</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Enter state"
                    {...register("state")}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-950/80 focus:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-semibold transition-all text-slate-100 placeholder:text-slate-600"
                    autoComplete="address-level1"
                  />
                </div>
              </div>

              {/* Country */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-200 uppercase tracking-wider block">Country</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Enter country"
                    {...register("country")}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-955/50 bg-slate-950/50 hover:bg-slate-950/80 focus:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-semibold transition-all text-slate-100 placeholder:text-slate-600"
                    autoComplete="country"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional & Academic Profile Section */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800/80 shadow-2xl rounded-3xl p-6 md:p-8 space-y-6 text-white">
          <h3 className="text-sm font-black text-blue-300 uppercase tracking-widest block border-b border-slate-800 pb-3">
            Professional & Academic Profile
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Job Title */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-200 uppercase tracking-wider block">Job Title</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g., AI Engineer, GTM Architect"
                  {...register("job_title")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-950/80 focus:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-semibold transition-all text-slate-100 placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Educational Qualifications */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-200 uppercase tracking-wider block">Educational Qualifications</label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g., B.Tech in Civil Engineering, MBA"
                  {...register("education")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-950/80 focus:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-semibold transition-all text-slate-100 placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/70 text-white rounded-2xl text-sm font-bold tracking-wide transition-all shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 active:scale-[0.98] flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </form>

      {/* Linked Enterprises Panel (Read-only Grid) */}
      <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800/80 shadow-2xl rounded-3xl p-6 md:p-8 space-y-6 text-white">
        <h3 className="text-sm font-black text-blue-300 uppercase tracking-widest block border-b border-slate-800 pb-3">
          Your Linked Businesses & Directory Profiles
        </h3>
        
        {linkedBusinesses.length === 0 ? (
          <div className="p-8 border border-slate-800/60 bg-slate-955/30 bg-slate-950/30 rounded-2xl text-center">
            <p className="text-sm text-slate-400 font-light">
              No registered business profiles found linked to this account email.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {linkedBusinesses.map((business) => (
              <Link
                key={business.id}
                href={`/dashboard/business/${business.id}`}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-950/70 transition-all group/card"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    {business.logo_url ? (
                      <img
                        src={business.logo_url}
                        alt={business.brand_name || "Logo"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Landmark className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-100 truncate">
                      {business.brand_name || "Unnamed Business"}
                    </h4>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {business.category || "No Category"}
                    </p>
                  </div>
                </div>
                
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 group-hover/card:text-white group-hover/card:border-slate-700 transition-all shrink-0">
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/card:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
