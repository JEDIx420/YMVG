"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XCircle, Send, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { sendAccessRequest } from "@/app/actions/accessRequest";

export default function UnauthorizedPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await sendAccessRequest(formData);

    if (result.success) {
      setIsSubmitted(true);
    } else {
      setError(result.error || "Failed to submit request.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12">
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                  <XCircle className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-black text-blue-950 mb-3">Authentication Failed</h1>
                <p className="text-slate-600 leading-relaxed font-medium">
                  Your Google Email does not match the registered email for this IMIS ID.
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  This happens if the business details were registered with a different contact email.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8">
                <h3 className="font-bold text-blue-950 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-blue-600 rounded-full"></span>
                  Request Manual Access
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100">
                      {error}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Your Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      required 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Google Account Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      required 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                      <input 
                        type="tel" 
                        name="phone" 
                        required 
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">YMI Club Name</label>
                      <input 
                        type="text" 
                        name="club" 
                        required 
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4 py-3.5 bg-blue-950 hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                    {loading ? "Sending..." : "Submit Access Request"}
                  </button>
                </form>
              </div>

              <div className="text-center">
                <Link href="/directory" className="text-blue-600 hover:text-blue-800 font-bold text-sm inline-flex items-center gap-1 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Return to Public Directory
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-8"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-emerald-900 mb-4">Request Sent!</h2>
              <p className="text-slate-600 mb-10 max-w-sm">
                Your request has been sent to regional leadership for review. We will manually verify your details and connect your email.
              </p>
              
              <Link 
                href="/directory" 
                className="w-full max-w-xs py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-xl shadow-blue-600/20 flex justify-center items-center gap-2"
              >
                Return to Directory
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
