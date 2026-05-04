"use client";

import { useState } from "react";
import { verifyImisId } from "@/app/actions/auth";
import { verifyMemberCredentials } from "@/app/actions/verifyMember";
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
  const [email, setEmail] = useState('');
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [message, setMessage] = useState('');
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

  const getURL = () => {
    let url =
      process?.env?.NEXT_PUBLIC_SITE_URL ??
      process?.env?.NEXT_PUBLIC_VERCEL_URL ??
      'http://localhost:3000';
    url = url.includes('http') ? url : `https://${url}`;
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
    return url;
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Use the browser's current origin dynamically to hit our callback
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !imisId.trim()) return;
    setIsMagicLinkLoading(true);
    setMessage('');

    try {
      // SECURITY STEP 1: Pre-flight Verification
      const { isValid } = await verifyMemberCredentials(imisId, email);

      if (!isValid) {
        setMessage('Error: This email does not match the registered email for this IMIS ID.');
        return; // finally block will handle loading state
      }
      
      // SECURITY STEP 2: The member is verified, send the OTP
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Point to our existing callback route
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Verification successful! Check your email for the secure login link.');
      }
    } catch (err) {
      console.error("Magic Link Execution Error:", err);
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      // GUARANTEED EXECUTION: Kill the loader
      setIsMagicLinkLoading(false);
    }
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
              <p className="text-slate-600 text-sm mb-6">
                Your IMIS ID is valid. Please sign in to continue.
              </p>

              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 mb-6 text-sm font-medium rounded-2xl border flex items-start text-left gap-3 ${
                    message.startsWith('Error') 
                      ? 'bg-red-50/80 text-red-800 border-red-200' 
                      : 'bg-emerald-50/80 text-emerald-800 border-emerald-200'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {message.startsWith('Error') ? <AlertCircle className="w-5 h-5 text-red-600" /> : <CheckCircle className="w-5 h-5 text-emerald-600" />}
                  </div>
                  <p className="leading-relaxed">
                    {message.replace(/^Error:\s*/, '')}
                  </p>
                </motion.div>
              )}

              <form onSubmit={handleMagicLinkLogin} className="space-y-4 mb-6">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all text-blue-950 font-medium"
                />
                <button
                  type="submit"
                  disabled={isMagicLinkLoading || !email.trim()}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isMagicLinkLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending Link...
                    </>
                  ) : (
                    'Send Magic Link'
                  )}
                </button>
              </form>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">OR</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className={`w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold py-3.5 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-3 active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Sign In with Google
                    </>
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
