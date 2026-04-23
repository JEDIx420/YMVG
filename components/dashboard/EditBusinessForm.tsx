"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/utils/supabase/client";
import { updateBusiness } from "@/app/actions/updateBusiness";
import { 
  Loader2, 
  Upload, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 1. Validation Schema
const businessSchema = z.object({
  brand_name: z.string().min(2, "Brand name must be at least 2 characters."),
  tagline: z.string().max(100, "Tagline must be under 100 characters.").optional(),
  description: z.string().min(10, "Description should be more substantial."),
  category: z.string().min(1, "Please select a category."),
  services: z.array(z.object({
    value: z.string().min(1, "Service name cannot be empty")
  })).min(1, "Add at least one service."),
  special_offer: z.string().optional(),
  website_url: z.string().url("Please enter a valid URL").or(z.literal("")).optional(),
  contact_phone: z.string().optional(),
  logo_url: z.string().optional(),
  primary_image_url: z.string().optional(),
});

type BusinessFormValues = z.infer<typeof businessSchema>;

const CATEGORIES = [
  "Professional Services",
  "Technology & Software",
  "Healthcare & Wellness",
  "Construction & Engineering",
  "Retail & E-commerce",
  "Food & Hospitality",
  "Financial Services",
  "Education & Training",
  "Legal Services",
  "Non-Profit & NGO",
  "Other"
];

interface EditBusinessFormProps {
  business: any;
}

export default function EditBusinessForm({ business }: EditBusinessFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({});
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const supabase = createClient();

  // 2. Initialize Form
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      brand_name: business.brand_name || "",
      tagline: business.tagline || "",
      description: business.description || "",
      category: business.category || "",
      services: business.services?.map((s: string) => ({ value: s })) || [{ value: "" }],
      special_offer: business.special_offer || "",
      website_url: business.website_url || "",
      contact_phone: business.contact_phone || "",
      logo_url: business.logo_url || "",
      primary_image_url: business.primary_image_url || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "services" as const,
  });

  const logoUrl = watch("logo_url");
  const primaryImageUrl = watch("primary_image_url");

  // 3. Image Upload Handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, bucket: string, field: "logo_url" | "primary_image_url") => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Basic Validation
    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Max size is 2MB.");
      return;
    }

    setIsUploading(prev => ({ ...prev, [field]: true }));
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${business.id}/${field}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setValue(field, publicUrl);
    } catch (error: any) {
      console.error("Upload failed", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  // 4. Submit Handler
  const onSubmit = async (data: BusinessFormValues) => {
    setIsSubmitting(true);
    setStatus(null);

    // Map services back to string array for DB
    const payload = {
      ...data,
      services: data.services.map(s => s.value)
    };

    const result = await updateBusiness(business.id, payload);

    if (result.success) {
      setStatus({ type: "success", message: "Your business profile has been updated successfully!" });
    } else {
      setStatus({ type: "error", message: result.error || "An unknown error occurred." });
    }
    
    setIsSubmitting(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`mb-8 p-4 rounded-xl flex items-center gap-3 border ${
              status.type === "success" 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {status.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{status.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
        {/* Section 1: Basic Information */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-blue-950">Brand Name</label>
              <input 
                {...register("brand_name")}
                className="w-full px-4 py-2 rounded-lg border border-slate-400 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-slate-900 placeholder:text-slate-500 bg-white"
              />
              {errors.brand_name && <p className="text-xs text-rose-600 font-medium">{errors.brand_name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-blue-950">Tagline</label>
              <input 
                {...register("tagline")}
                placeholder="E.g. Building a better world"
                className="w-full px-4 py-2 rounded-lg border border-slate-400 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-slate-900 placeholder:text-slate-500 bg-white"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-blue-950">Category</label>
              <select 
                {...register("category")}
                className="w-full px-4 py-2 rounded-lg border border-slate-400 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-slate-900 placeholder:text-slate-500 bg-white"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-blue-950">Description</label>
              <textarea 
                {...register("description")}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-slate-400 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-slate-900 placeholder:text-slate-500 bg-white"
                placeholder="Tell the community about your business, history, and mission..."
              />
              {errors.description && <p className="text-xs text-rose-600 font-medium">{errors.description.message}</p>}
            </div>
          </div>
        </section>

        {/* Section 2: Branding & Imagery */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-8">
          <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-red-600 rounded-full"></span>
            Branding & Imagery
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Logo Upload */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-blue-950 block">Company Logo</label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                  {isUploading.logo_url && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
                <label className="cursor-pointer px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-white" />
                  Upload Logo
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handleFileUpload(e, 'logos', 'logo_url')}
                  />
                </label>
              </div>
            </div>

            {/* Primary Image Upload */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-blue-950 block">Primary Business Image</label>
              <div className="aspect-video w-full rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                {primaryImageUrl ? (
                  <img src={primaryImageUrl} alt="Primary" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-slate-300" />
                )}
                {isUploading.primary_image_url && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                )}
                <label className="absolute bottom-4 right-4 cursor-pointer px-5 py-2.5 bg-white hover:bg-slate-50 text-blue-600 rounded-xl text-sm font-bold shadow-xl border border-slate-200 transition-all active:scale-95 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  Select Image
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handleFileUpload(e, 'business-images', 'primary_image_url')}
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Services & Offers */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
            Services & Offers
          </h2>

          <div className="space-y-4">
            <label className="text-sm font-bold text-blue-950 block">Key Services</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <input 
                    {...register(`services.${index}.value` as const)}
                    placeholder="E.g. Web Design"
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-500 bg-white"
                  />
                  {fields.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => remove(index)}
                      className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button 
              type="button" 
              onClick={() => append({ value: "" })}
              className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Another Service
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-blue-950">Special Offer / Member Discount</label>
            <input 
              {...register("special_offer")}
              placeholder="E.g. 15% off for YMI Members"
              className="w-full px-4 py-2 rounded-lg border border-amber-300 bg-amber-50/50 focus:ring-2 focus:ring-amber-500 outline-none transition-all text-slate-900 placeholder:text-amber-700/50 font-medium"
            />
          </div>
        </section>

        {/* Section 4: Contact & Links */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
            Contact & Reach
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-blue-950">Website URL</label>
              <input 
                {...register("website_url")}
                placeholder="https://example.com"
                className="w-full px-4 py-2 rounded-lg border border-slate-400 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-slate-900 placeholder:text-slate-500 bg-white"
              />
              {errors.website_url && <p className="text-xs text-rose-600 font-medium">{errors.website_url.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-blue-950">Public Contact Phone</label>
              <input 
                {...register("contact_phone")}
                placeholder="+91 0000 000000"
                className="w-full px-4 py-2 rounded-lg border border-slate-400 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-slate-900 placeholder:text-slate-500 bg-white"
              />
            </div>
          </div>
        </section>

        <div className="pt-8 sticky bottom-0 bg-white/80 backdrop-blur-md p-4 rounded-t-3xl border-t border-slate-100 flex justify-end shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          <button 
            type="submit" 
            disabled={isSubmitting || Object.values(isUploading).some(v => v)}
            className="px-12 py-4 bg-blue-950 hover:bg-black text-white rounded-full font-bold transition-all shadow-xl hover:shadow-black/20 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                Save Profile Configuration
                <motion.span 
                  className="group-hover:translate-x-1 transition-transform"
                >
                  →
                </motion.span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
