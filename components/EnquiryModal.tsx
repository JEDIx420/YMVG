"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CheckCircle, AlertCircle } from "lucide-react";
import { sendLead } from "@/app/actions/sendLead";

const enquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(5, "Please enter a valid phone number"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type EnquiryFormData = z.infer<typeof enquirySchema>;

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
}

export default function EnquiryModal({ isOpen, onClose, businessId, businessName }: EnquiryModalProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EnquiryFormData>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: ""
    }
  });

  const onSubmit = async (data: EnquiryFormData) => {
    setStatus("submitting");
    try {
      const result = await sendLead({ ...data, businessId });
      if (result.success) {
        setStatus("success");
        setTimeout(() => {
          onClose();
          setStatus("idle");
          reset();
        }, 3000);
      } else {
        setStatus("error");
        setErrorMessage(result.error || "Something went wrong.");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage("An unexpected error occurred.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-blue-950/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-blue-950 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Express Interest</h2>
                <p className="text-sm text-blue-300 font-medium">Send an enquiry to {businessName}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              {status === "success" ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-12 text-center space-y-4"
                >
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-black text-blue-950">Enquiry Sent!</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">
                    Your message has been dispatched successfully. {businessName} will contact you shortly.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {status === "error" && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-sm">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p>{errorMessage}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-blue-950 uppercase tracking-widest">Your Name</label>
                      <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            className={`w-full p-4 bg-slate-50 border ${errors.name ? 'border-red-400' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-blue-950`}
                            placeholder="John Doe"
                          />
                        )}
                      />
                      {errors.name && <p className="text-xs text-red-500 font-bold">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-blue-950 uppercase tracking-widest">Phone Number</label>
                      <Controller
                        name="phone"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            className={`w-full p-4 bg-slate-50 border ${errors.phone ? 'border-red-400' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-blue-950`}
                            placeholder="+91 98765 43210"
                          />
                        )}
                      />
                      {errors.phone && <p className="text-xs text-red-500 font-bold">{errors.phone.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-blue-950 uppercase tracking-widest">Email Address</label>
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          className={`w-full p-4 bg-slate-50 border ${errors.email ? 'border-red-400' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-blue-950`}
                          placeholder="john@example.com"
                        />
                      )}
                    />
                    {errors.email && <p className="text-xs text-red-500 font-bold">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-blue-950 uppercase tracking-widest">Message</label>
                    <Controller
                      name="message"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          rows={4}
                          className={`w-full p-4 bg-slate-50 border ${errors.message ? 'border-red-400' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-blue-950 resize-none`}
                          placeholder="Hello, I'm interested in your services..."
                        />
                      )}
                    />
                    {errors.message && <p className="text-xs text-red-500 font-bold">{errors.message.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${
                      status === "submitting" 
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                        : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/30 active:scale-[0.98]"
                    }`}
                  >
                    {status === "submitting" ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-6 h-6 border-4 border-slate-300 border-t-red-600 rounded-full"
                        />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Dispatch Enquiry
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
            
            <div className="bg-slate-50 p-4 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Protected by Y's Men's International Regional Privacy Standards
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
