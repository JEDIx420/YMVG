"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  Globe 
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
});

type PersonalProfileFormValues = z.infer<typeof personalProfileSchema>;

interface PersonalProfileFormProps {
  profile: Profile;
}

export default function PersonalProfileForm({ profile }: PersonalProfileFormProps) {
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
    },
  });

  const onSubmit = async (data: PersonalProfileFormValues) => {
    setIsSubmitting(true);
    setStatus(null);

    try {
      const result = await updatePersonalProfile({
        full_name: data.full_name,
        phone: data.phone,
        imis_id: data.imis_id || null,
        ym_region: data.ym_region || null,
        ym_district: data.ym_district || null,
        ym_zone: data.ym_zone || null,
        ym_club: data.ym_club || null,
      });

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
    <div className="space-y-6 max-w-4xl mx-auto">
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 rounded-2xl flex items-center gap-3 border ${
              status.type === "success" 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            )}
            <span className="font-semibold text-sm">{status.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Core Identity Card (Read-only section) */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6 md:p-8 space-y-6">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest block border-b border-slate-200/50 pb-3">
            System Identity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Registered Email</label>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-200/80 bg-slate-100 text-slate-400 font-semibold cursor-not-allowed text-sm">
                <User className="w-4 h-4 shrink-0 text-slate-400" />
                <span>{profile.email}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Security Role</label>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-200/80 bg-slate-100 text-slate-400 font-semibold cursor-not-allowed text-sm uppercase tracking-wide">
                <Shield className="w-4 h-4 shrink-0 text-slate-400" />
                <span>{profile.app_role.replace("_", " ")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details (Editable section) */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-lg rounded-3xl p-6 md:p-8 space-y-6">
          <h3 className="text-sm font-black text-blue-950 uppercase tracking-widest block border-b border-slate-200/60 pb-3">
            Personal Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-xs font-black text-blue-950 uppercase tracking-wider block">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  {...register("full_name")}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 focus:bg-white focus:border-blue-950 focus:ring-2 focus:ring-blue-950/5 outline-none text-sm font-semibold transition-all ${
                    errors.full_name ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/5" : "border-slate-200"
                  }`}
                />
              </div>
              {errors.full_name && (
                <p className="text-xs text-rose-600 font-bold">{errors.full_name.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label className="text-xs font-black text-blue-950 uppercase tracking-wider block">Phone Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="Enter contact number"
                  {...register("phone")}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 focus:bg-white focus:border-blue-950 focus:ring-2 focus:ring-blue-950/5 outline-none text-sm font-semibold transition-all ${
                    errors.phone ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/5" : "border-slate-200"
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-rose-600 font-bold">{errors.phone.message}</p>
              )}
            </div>

            {/* IMIS ID */}
            <div className="space-y-2">
              <label className="text-xs font-black text-blue-950 uppercase tracking-wider block">IMIS ID</label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. YMI-12345"
                  {...register("imis_id")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 focus:bg-white focus:border-blue-950 focus:ring-2 focus:ring-blue-950/5 outline-none text-sm font-semibold transition-all"
                />
              </div>
            </div>

            {/* Y's Men Club */}
            <div className="space-y-2">
              <label className="text-xs font-black text-blue-950 uppercase tracking-wider block">Y's Men Club</label>
              <div className="relative">
                <Landmark className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter club affiliation"
                  {...register("ym_club")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 focus:bg-white focus:border-blue-950 focus:ring-2 focus:ring-blue-950/5 outline-none text-sm font-semibold transition-all"
                />
              </div>
            </div>

            {/* Region */}
            <div className="space-y-2">
              <label className="text-xs font-black text-blue-950 uppercase tracking-wider block">Region</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. SWIR"
                  {...register("ym_region")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 focus:bg-white focus:border-blue-950 focus:ring-2 focus:ring-blue-950/5 outline-none text-sm font-semibold transition-all"
                />
              </div>
            </div>

            {/* District */}
            <div className="space-y-2">
              <label className="text-xs font-black text-blue-950 uppercase tracking-wider block">District</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. District I"
                  {...register("ym_district")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 focus:bg-white focus:border-blue-950 focus:ring-2 focus:ring-blue-950/5 outline-none text-sm font-semibold transition-all"
                />
              </div>
            </div>

            {/* Zone */}
            <div className="space-y-2">
              <label className="text-xs font-black text-blue-950 uppercase tracking-wider block">Zone</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Zone A"
                  {...register("ym_zone")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 focus:bg-white focus:border-blue-950 focus:ring-2 focus:ring-blue-950/5 outline-none text-sm font-semibold transition-all"
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
            className="px-6 py-3.5 bg-blue-950 hover:bg-black disabled:bg-blue-950/70 text-white rounded-2xl text-sm font-bold tracking-wide transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center gap-2 cursor-pointer"
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
    </div>
  );
}
