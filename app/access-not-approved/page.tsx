import Link from "next/link";
import { ShieldX } from "lucide-react";

const YSMEN_ENROLL_URL = process.env.NEXT_PUBLIC_YSMEN_ENROLL_URL || "https://www.ysmen.org/join-us/";

export default function AccessNotApprovedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#fee2e2,_transparent_38%),linear-gradient(145deg,_#f8fafc,_#eff6ff)] p-4">
      <section className="w-full max-w-lg rounded-3xl border border-white bg-white p-8 text-center shadow-2xl shadow-slate-950/10 sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
          <ShieldX className="h-8 w-8" />
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-red-600">Access not approved</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-blue-950">No approved account found</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">No approved YMBD account was found for this email.</p>

        <div className="mt-8 grid gap-3">
          <Link href="/signup" className="rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-red-700">
            Apply for an account
          </Link>
          <a href={YSMEN_ENROLL_URL} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-slate-100 px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200">
            Enroll as a Y&apos;s Man
          </a>
          <Link href="/login" className="px-5 py-3 text-sm font-bold text-blue-700 transition hover:text-blue-950">
            Return to login
          </Link>
        </div>
      </section>
    </main>
  );
}
