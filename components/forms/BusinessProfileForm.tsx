"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/utils/supabase/client";
import { addBusiness } from "@/app/actions/addBusiness";
import { updateBusiness } from "@/app/actions/updateBusiness";
import { Business, Profile } from "@/types/database.types";
import { 
  Loader2, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle,
  Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const onboardingSchema = z.object({
  brand_name: z.string().min(2, "Brand name must be at least 2 characters."),
  category: z.string().min(1, "Please select a category."),
  tagline: z.string().max(100, "Tagline must be under 100 characters.").optional(),
  description: z.string().min(10, "Description should be more substantial."),
  contact_email: z.string().email("Please enter a valid email."),
  contact_phone: z.string().optional(),
  website_url: z.string().url("Please enter a valid URL").or(z.literal("")).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  services: z.string().min(1, "Please enter at least one service."),
  special_offer: z.string().optional(),
});

type BusinessFormValues = z.infer<typeof onboardingSchema>;

interface BusinessProfileFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Business> | Profile | null;
}

export default function BusinessProfileForm({ mode, initialData }: BusinessProfileFormProps) {
  const init = (initialData || {}) as Partial<Business & Profile>;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({});
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [logoUrl, setLogoUrl] = useState(init.logo_url || "");
  const [brochureUrl, setBrochureUrl] = useState(init.brochure_url || "");
  const [primaryImageUrl, setPrimaryImageUrl] = useState(init.primary_image_url || "");

  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      brand_name: init.brand_name || "",
      category: init.category || "",
      tagline: init.tagline || "",
      description: init.description || "",
      contact_email: init.contact_email || init.email || "",
      contact_phone: init.contact_phone || init.phone || "",
      website_url: init.website_url || "",
      address: init.address || "",
      city: init.city || "",
      state: init.state || "",
      country: init.country || (mode === 'create' ? "India" : ""),
      services: init.services ? init.services.join(', ') : "",
      special_offer: init.special_offer || "",
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, bucket: string, field: "logo_url" | "brochure_url" | "primary_image_url") => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Max size is 5MB.");
      return;
    }

    setIsUploading(prev => ({ ...prev, [field]: true }));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${field}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (field === "logo_url") setLogoUrl(publicUrl);
      if (field === "brochure_url") setBrochureUrl(publicUrl);
      if (field === "primary_image_url") setPrimaryImageUrl(publicUrl);
      
    } catch (error) {
      console.error("Upload failed", error);
      const errMsg = error instanceof Error ? error.message : "An unexpected error occurred.";
      alert(`Upload failed: ${errMsg}`);
    } finally {
      setIsUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const onSubmit = async (data: BusinessFormValues) => {
    setIsSubmitting(true);
    setStatus(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error(`You must be logged in to ${mode === 'create' ? 'create' : 'update'} a business.`);
      }

      // Convert comma-separated services to array
      const servicesArray = data.services
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const cleanPayload = {
        brand_name: data.brand_name,
        category: data.category,
        tagline: data.tagline || null,
        description: data.description,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone || null,
        website_url: data.website_url || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,
        ym_designation: init.ym_designation || null,
        services: servicesArray,
        special_offer: data.special_offer || null,
        logo_url: logoUrl || null,
        brochure_url: brochureUrl || null,
        primary_image_url: primaryImageUrl || null,
        gallery_urls: init.gallery_urls || null,
      };

      if (mode === 'create') {
        const result = await addBusiness(cleanPayload);
        if (!result.success) throw new Error(result.error || "Failed to create profile.");
      } else {
        if (!initialData?.id) throw new Error("Missing business ID for update.");
        const result = await updateBusiness(initialData.id, cleanPayload);
        if (result.error) throw new Error(result.error);
      }

      setStatus({ type: "success", message: `Business profile ${mode === 'create' ? 'created' : 'updated'} successfully! Redirecting...` });
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Failed to create business profile.";
      console.error(error);
      setStatus({ type: "error", message: errMsg });
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-blue-700" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-blue-950 mb-3">{mode === 'create' ? 'Create' : 'Edit'} Your Business Profile</h1>
          <p className="text-slate-600 text-lg">{mode === 'create' ? 'Set up' : 'Update'} your presence in the {"Y's Men's"} International Business Directory</p>
        </div>

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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-20">
          
          {/* Section 1: Basic Information */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-blue-950">Brand Name *</label>
                <input 
                  {...register("brand_name")}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-900"
                  placeholder="e.g. Acme Corp"
                />
                {errors.brand_name && <p className="text-xs text-rose-600 font-medium">{errors.brand_name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-blue-950">Category *</label>
                <select 
                  {...register("category")}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-900 bg-white"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && <p className="text-xs text-rose-600 font-medium">{errors.category.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-blue-950">Tagline</label>
                <input 
                  {...register("tagline")}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-900"
                  placeholder="A short, catchy phrase about your business"
                />
                {errors.tagline && <p className="text-xs text-rose-600 font-medium">{errors.tagline.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-blue-950">Description *</label>
                <textarea 
                  {...register("description")}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-900"
                  placeholder="Tell us about what you do..."
                />
                {errors.description && <p className="text-xs text-rose-600 font-medium">{errors.description.message}</p>}
              </div>
            </div>
          </section>

          {/* Section 2: Contact & Location */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
              Contact & Location
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-blue-950">Contact Email *</label>
                <input 
                  {...register("contact_email")}
                  type="email"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-900"
                />
                {errors.contact_email && <p className="text-xs text-rose-600 font-medium">{errors.contact_email.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-blue-950">Contact Phone</label>
                <input 
                  {...register("contact_phone")}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-900"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-blue-950">Website URL</label>
                <input 
                  {...register("website_url")}
                  placeholder="https://..."
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-900"
                />
                {errors.website_url && <p className="text-xs text-rose-600 font-medium">{errors.website_url.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-blue-950">Address</label>
                <textarea 
                  {...register("address")}
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-900"
                />
                <p className="text-xs text-slate-500 mt-1">
                  The business address entered here will be publicly visible in the directory. Do not enter a private residential address unless you want it displayed publicly. You may publish only your City and State instead of a full street address if preferred.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-blue-950">City</label>
                <input 
                  {...register("city")}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-900"
                  placeholder="e.g. Thiruvananthapuram"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-blue-950">State</label>
                <input 
                  {...register("state")}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-900"
                  placeholder="e.g. Kerala"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-blue-950">Country</label>
                <input 
                  {...register("country")}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-900"
                  placeholder="e.g. India"
                />
              </div>

              <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-blue-600">Club affiliation</p>
                <p className="mt-1 text-sm font-bold text-blue-950">{init.ym_club || init.club || "Derived from your approved member profile"}</p>
                <p className="mt-1 text-xs text-blue-700">District, zone, and SWIR region are assigned automatically and cannot be entered here.</p>
              </div>
            </div>
          </section>

          {/* Section 3: Details */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
              Details & Services
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-blue-950">Services * <span className="text-slate-500 font-normal">(Comma-separated)</span></label>
                <input 
                  {...register("services")}
                  placeholder="e.g. Consulting, Web Design, Marketing"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-900"
                />
                {errors.services && <p className="text-xs text-rose-600 font-medium">{errors.services.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-blue-950">Special Offer / Member Discount</label>
                <input 
                  {...register("special_offer")}
                  placeholder="e.g. 15% off for Y's Men's International Members"
                  className="w-full px-4 py-2 rounded-lg border border-amber-300 bg-amber-50/50 focus:ring-2 focus:ring-amber-500 outline-none transition-all text-slate-900 placeholder:text-amber-700/50"
                />
              </div>
            </div>
          </section>

          {/* Section 4: Media Uploads */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-8">
            <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-red-600 rounded-full"></span>
              Media & Files
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Primary Showcase Image Upload */}
              <div className="space-y-4 md:col-span-2">
                <label className="text-sm font-bold text-blue-950 block">Primary Showcase / Cover Image</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-full sm:w-64 h-36 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative shadow-sm">
                    {primaryImageUrl ? (
                      <img src={primaryImageUrl} alt="Cover Showcase" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    )}
                    {isUploading.primary_image_url && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Cover Image
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handleFileUpload(e, 'business-images', 'primary_image_url')}
                    />
                  </label>
                </div>
              </div>

              {/* Logo Upload */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-blue-950 block">Company Logo</label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative">
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
                  <label className="cursor-pointer px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                    <Upload className="w-4 h-4" />
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

              {/* Brochure Upload */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-blue-950 block">Company Brochure (PDF/Image)</label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative">
                    {brochureUrl ? (
                      <div className="text-emerald-600 text-sm font-bold text-center p-2">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-1" />
                        Uploaded
                      </div>
                    ) : (
                      <Briefcase className="w-8 h-8 text-slate-300" />
                    )}
                    {isUploading.brochure_url && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Brochure
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="application/pdf,image/*" 
                      onChange={(e) => handleFileUpload(e, 'brochures', 'brochure_url')}
                    />
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Fixed Submit Footer */}
          <div className="pt-8 sticky bottom-0 bg-white/80 backdrop-blur-md p-4 rounded-t-3xl border-t border-slate-100 flex justify-end shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
            <button 
              type="submit" 
              disabled={isSubmitting || Object.values(isUploading).some(v => v)}
              className="px-12 py-4 bg-blue-950 hover:bg-black text-white rounded-full font-bold transition-all shadow-xl hover:shadow-black/20 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {mode === 'create' ? 'Creating Profile...' : 'Saving Changes...'}
                </>
              ) : (
                mode === 'create' ? "Create Business Profile" : "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
