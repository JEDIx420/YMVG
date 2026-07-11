"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateProfile } from "@/app/actions/profiles";
import { Loader2, User, Phone, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Profile } from "@/types/database.types";

const profileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters."),
  phone: z.string().min(5, "Please enter a valid phone number."),
  club: z.string().min(2, "Please enter your Y's Men Club affiliation."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileOnboardingFormProps {
  initialEmail: string;
  initialName?: string | null;
  profile: Profile;
}

export default function ProfileOnboardingForm({ initialEmail, initialName, profile }: ProfileOnboardingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name || initialName || "",
      phone: profile.phone || "",
      club: profile.club || profile.ym_club || "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    setStatus(null);

    try {
      const result = await updateProfile(data);

      if (!result.success) {
        throw new Error(result.error || "Failed to update profile.");
      }

      setStatus({ type: "success", message: "Profile saved successfully! Welcome to the YMI directory." });
      
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (error: any) {
      console.error(error);
      setStatus({ type: "error", message: error.message || "Failed to update profile." });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 rounded-xl flex items-center gap-3 border ${
              status.type === "success" 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {status.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span className="font-medium text-sm">{status.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email Field (Disabled) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Registered Email</label>
          <input
            type="email"
            disabled
            value={initialEmail}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 font-medium cursor-not-allowed outline-none text-sm"
          />
        </div>

        {/* Full Name Field */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-blue-950 uppercase tracking-wider block">Full Name *</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
              <User className="w-4 h-4" />
            </div>
            <input
              {...register("full_name")}
              type="text"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900 placeholder:text-slate-400 text-sm"
              placeholder="e.g. John Doe"
            />
          </div>
          {errors.full_name && <p className="text-xs text-rose-600 font-medium mt-1">{errors.full_name.message}</p>}
        </div>

        {/* Contact Phone Field */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-blue-950 uppercase tracking-wider block">Contact Phone *</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
              <Phone className="w-4 h-4" />
            </div>
            <input
              {...register("phone")}
              type="tel"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900 placeholder:text-slate-400 text-sm"
              placeholder="e.g. +91 98765 43210"
            />
          </div>
          {errors.phone && <p className="text-xs text-rose-600 font-medium mt-1">{errors.phone.message}</p>}
        </div>

        {/* Club Affiliation Field */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-blue-950 uppercase tracking-wider block">Y's Men's Club Affiliation *</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              {...register("club")}
              type="text"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900 placeholder:text-slate-400 text-sm"
              placeholder="e.g. SWIR Regional Club"
            />
          </div>
          {errors.club && <p className="text-xs text-rose-600 font-medium mt-1">{errors.club.message}</p>}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-6 bg-blue-950 hover:bg-black text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving Profile...
            </>
          ) : (
            "Complete Onboarding"
          )}
        </button>
      </form>
    </div>
  );
}
