import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import BusinessProfileForm from "@/components/forms/BusinessProfileForm";
import Link from "next/link";

export default async function OnboardingServerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch the logged-in user's profile record to extract personal and YMI club details
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, phone, club_id, ym_region, ym_club, ym_district, ym_zone, full_name, imis_id')
    .eq('user_id', user.id)
    .single();

  if (!profile?.club_id) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-3xl border border-amber-200 bg-white p-8 shadow-xl shadow-slate-950/5">
          <h1 className="text-3xl font-black text-blue-950">Select your SWIR club first</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Business listings inherit the approved club, district, zone, and region from your member profile.</p>
          <Link href="/dashboard/profile" className="mt-6 inline-flex rounded-xl bg-blue-950 px-6 py-3 text-sm font-bold text-white hover:bg-black">
            Complete club affiliation
          </Link>
        </div>
      </div>
    );
  }

  return <BusinessProfileForm mode="create" initialData={profile} />;
}
