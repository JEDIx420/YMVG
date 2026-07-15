"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const YSMEN_ENROLL_URL = process.env.NEXT_PUBLIC_YSMEN_ENROLL_URL || "https://www.ysmen.org/join-us/";

export default function LoginPage() {
  const [oauthLoading, setOauthLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const supabase = createClient();

  const callbackUrl = () => `${window.location.origin}/auth/callback?next=/dashboard`;

  const handleGoogleSignIn = async () => {
    setOauthLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });

    if (signInError) {
      console.error("Google sign-in failed:", signInError);
      setError("Sign-in could not be started. Please try again.");
      setOauthLoading(false);
    }
  };

  const handleMagicLinkLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setMagicLinkLoading(true);
    setMessage(null);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { emailRedirectTo: callbackUrl() },
    });

    if (signInError) {
      console.error("Magic-link sign-in failed:", signInError);
      setError("A secure login link could not be sent. Confirm your approved email and try again.");
    } else {
      setMessage("Check your email for the secure login link.");
    }
    setMagicLinkLoading(false);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,_#dbeafe_0,_transparent_32%),linear-gradient(145deg,_#f8fafc,_#fff7ed)] px-4 py-10 sm:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-2xl shadow-slate-950/10 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative overflow-hidden bg-blue-950 p-8 text-white sm:p-12">
          <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:18px_18px]" />
          <div className="relative flex h-full flex-col justify-between gap-12">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <p className="mt-8 text-xs font-black uppercase tracking-[0.25em] text-red-400">YMBD member access</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">One directory. Verified members.</h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-blue-100/75">Sign in with the email attached to your existing profile or approved registration request.</p>
            </div>

            <div className="space-y-3 border-t border-white/10 pt-6 text-sm text-blue-100/80">
              <p>New to YMBD? Submit an account request for reviewer approval.</p>
              <Link href="/signup" className="inline-flex items-center gap-2 font-bold text-white hover:text-red-300">
                Apply for an account <UserPlus className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-600">Login</p>
            <h2 className="mt-2 text-3xl font-black text-blue-950">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Use your approved email address with either supported login method.</p>
          </div>

          {error && (
            <div className="mb-5 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {message && (
            <div className="mb-5 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {message}
            </div>
          )}

          <form onSubmit={handleMagicLinkLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-2 block text-sm font-bold text-blue-950">Email address</label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <button
              type="submit"
              disabled={magicLinkLoading || !email.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700 disabled:opacity-50"
            >
              {magicLinkLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send secure login link
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={oauthLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {oauthLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
            Sign in with Google
          </button>

          <div className="mt-8 grid gap-3 border-t border-slate-100 pt-6 sm:grid-cols-2">
            <Link href="/signup" className="flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100">
              <UserPlus className="h-4 w-4" /> Apply for an account
            </Link>
            <a href={YSMEN_ENROLL_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200">
              Enroll as a Y&apos;s Man <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09A6.9 6.9 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
