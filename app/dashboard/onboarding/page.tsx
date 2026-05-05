import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import BusinessProfileForm from "@/components/forms/BusinessProfileForm";

export default async function OnboardingServerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch the most recently updated business to extract YMI details
  const { data: recentBusinesses } = await supabase
    .from('businesses')
    .select('owner_phone, ym_club, ym_district, ym_zone, ym_region')
    .eq('owner_id', user.id)
    .limit(1);

  const recentBusiness = recentBusinesses?.[0] || null;

  return <BusinessProfileForm mode="create" initialData={recentBusiness || undefined} />;
}
