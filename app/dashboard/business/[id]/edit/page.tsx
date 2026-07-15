import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import BusinessProfileForm from "@/components/forms/BusinessProfileForm";

type Params = Promise<{ id: string }>;

export default async function EditBusinessPage(props: { params: Params }) {
  const params = await props.params;
  const { id } = params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { getCurrentProfile } = await import("@/app/actions/profiles");
  const profile = await getCurrentProfile();

  const query = supabase
    .from('businesses')
    .select('*')
    .eq('id', id);

  if (profile?.app_role !== 'super_admin') {
    query.eq('owner_id', user.id);
  }

  const { data: business } = await query.single();

  if (!business) {
    redirect('/dashboard');
  }

  return <BusinessProfileForm mode="edit" initialData={business} />;
}
