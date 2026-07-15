import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import type { SwirClub } from "@/types/database.types";
import SignupForm from "./SignupForm";

export const metadata: Metadata = {
  title: "Apply for an Account - YMBD",
  description: "Submit a registration request for access to the SWIR business directory.",
};

export default async function SignupPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_selectable_swir_clubs");
  const clubs = (data || []) as SwirClub[];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe_0,_transparent_35%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_45%,_#fff7ed_100%)] px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-red-600">Y&apos;s Men International SWIR</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-blue-950 sm:text-5xl">Member access starts here.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">Submit your details for review. Approval activates a standard member account; business registration remains optional.</p>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xl">
            <h2 className="text-xl font-black text-blue-950">Club directory unavailable</h2>
            <p className="mt-2 text-sm text-slate-600">The registration form cannot load safely right now. Please try again later.</p>
          </div>
        ) : (
          <SignupForm clubs={clubs} />
        )}
      </div>
    </main>
  );
}
