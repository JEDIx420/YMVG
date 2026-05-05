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

  // Fetch the specific business and securely verify ownership
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single();

  if (!business) {
    redirect('/dashboard');
  }

  return <BusinessProfileForm mode="edit" initialData={business} />;
}
