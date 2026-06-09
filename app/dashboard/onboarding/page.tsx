import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import BusinessProfileForm from "@/components/forms/BusinessProfileForm";

export default async function OnboardingServerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch the logged-in user's profile record to extract personal and YMI club details
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, phone, ym_region, ym_club, ym_district, ym_zone, full_name, imis_id')
    .eq('user_id', user.id)
    .single();

  return <BusinessProfileForm mode="create" initialData={profile || null} />;
}
