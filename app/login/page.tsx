"use client";

import { useState } from "react";
import { verifyImisId } from "@/app/actions/auth";
import { sendAccessRequest } from "@/app/actions/accessRequest";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2, AlertCircle, UserPlus, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [imisId, setImisId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [view, setView] = useState<"login" | "enroll" | "success">("login");
  const [enrollLoading, setEnrollLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imisId.trim()) return;

    setLoading(true);
    setError(null);

    const result = await verifyImisId(imisId.trim());

    if (result.success) {
      setVerified(true);
    } else {
      setError(result.error || "Failed to verify IMIS ID.");
    }
    
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 overflow-hidden relative">
        <div className="text-center mb-8 relative z-10">
          {view === "login" && (
            <>
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-tight mb-2">
                Registered Y's Men Login
              </h1>
              <p className="text-slate-600 font-light">
                Please enter your YMI IMIS ID to access the member dashboard.
              </p>
            </>
          )}
          {view === "enroll" && (
            <>
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <UserPlus className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-tight mb-2">
                Enroll as a Y's Men
              </h1>
              <p className="text-slate-600 font-light">
                Submit an application to gain verified member access to our network.
              </p>
            </>
          )}
          {view === "success" && (
            <>
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-black text-emerald-900 tracking-tight leading-tight mb-2">
                Application Received
              </h1>
              <p className="text-slate-600 font-light">
                Our leadership will get back to you shortly regarding your access request.
              </p>
            </>
          )}
        </div>

        <AnimatePresence mode="wait">
          {view === "login" && !verified && (
            <motion.form 
              key="form"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              onSubmit={handleSubmit} 
              className="space-y-6 relative z-10"
            >
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-blue-950 block">YMI IMIS ID</label>
                <input
                  type="text"
                  value={imisId}
                  onChange={(e) => setImisId(e.target.value)}
                  placeholder="e.g. YMI-12345"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all text-blue-950 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !imisId.trim()}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Verify Access"
                )}
              </button>

              <button
                type="button"
                onClick={() => { setError(null); setView("enroll"); }}
                className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-bold transition-all shadow-sm active:scale-95 flex justify-center items-center gap-2"
              >
                Enroll as a Y's Men
              </button>
            </motion.form>
          )}

          {view === "login" && verified && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center relative z-10 py-6"
            >
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-8 h-8" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-emerald-800 mb-2">Identity Verified</h2>
              <p className="text-slate-600 text-sm mb-8">
                Your IMIS ID is valid. Please sign in with your registered Google account to continue.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-colors flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    'Sign In with Google'
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {view === "enroll" && (
            <motion.form 
              key="enroll-form"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              onSubmit={async (e) => {
                e.preventDefault();
                setEnrollLoading(true);
                setError(null);
                const formData = new FormData(e.currentTarget as HTMLFormElement);
                const res = await sendAccessRequest(formData);
                if (res.success) {
                  setView("success");
                } else {
                  setError(res.error || "Failed to submit.");
                }
                setEnrollLoading(false);
              }}
              className="space-y-4 relative z-10 w-full"
            >
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-blue-950 block">Full Name</label>
                <input required name="name" type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all text-sm text-slate-900 font-medium" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-blue-950 block">Email Address</label>
                <input required name="email" type="email" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all text-sm text-slate-900 font-medium" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-blue-950 block">Phone Number</label>
                <input required name="phone" type="tel" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all text-sm text-slate-900 font-medium" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-blue-950 block">Location / Address</label>
                <input required name="location" type="text" placeholder="e.g. City, State, or Country" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all text-sm text-slate-900 font-medium" />
              </div>

              <button
                type="submit"
                disabled={enrollLoading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex justify-center items-center mt-6"
              >
                {enrollLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Application"}
              </button>

              <button
                type="button"
                onClick={() => { setError(null); setView("login"); }}
                className="w-full py-3 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-all mt-1"
              >
                Back to Login
              </button>
            </motion.form>
          )}

          {view === "success" && (
            <motion.div
              key="success-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-10 flex flex-col items-center pt-4"
            >
              <button
                onClick={() => router.push('/')}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95"
              >
                Return to Homescreen
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decorative background element */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-50 z-0"></div>
      </div>
    </div>
  );
}
