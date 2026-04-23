"use client";

import { useState } from "react";
import { verifyImisId } from "@/app/actions/auth";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [imisId, setImisId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const supabase = createClient();

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
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-tight mb-2">
            VIP Gateway
          </h1>
          <p className="text-slate-600 font-light">
            Please enter your YMI IMIS ID to access the member dashboard.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!verified ? (
            <motion.form 
              key="form"
              initial={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
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
            </motion.form>
          ) : (
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
        </AnimatePresence>

        {/* Decorative background element */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-50 z-0"></div>
      </div>
    </div>
  );
}
