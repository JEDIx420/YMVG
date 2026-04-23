import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Check 1: Session Check
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login'); // We should redirect to the new login page, not root.
  }

  // Better VIP Flow Validation:
  // First, check if they already have an established link
  const { data: ownedBusiness } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (ownedBusiness) {
    // Already verified and linked. Grant passage.
    return <>{children}</>;
  }

  // Read the cookie. If it's not present, we assume they bypassed the IMIS check.
  const cookieStore = await cookies();
  const imisId = cookieStore.get('imis_id')?.value;

  if (!imisId) {
    // Missing cookie. Could be direct URL entry or expired.
    await supabase.auth.signOut();
    redirect('/unauthorized');
  }

  // Use the cookie to find the matching business with this email.
  const { data: match, error } = await supabase
    .from('businesses')
    .select('id, owner_id')
    .eq('contact_email', user.email)
    .eq('imis_id', imisId)
    .single(); // We expect exactly one match

  if (error || !match) {
    // Match failed.
    await supabase.auth.signOut(); // Kill the session
    redirect('/unauthorized');
  }

  // The Match was Successful!
  // Link this business to the user
  await supabase
    .from('businesses')
    .update({ owner_id: user.id, owner_name: user.user_metadata?.full_name || null })
    .eq('id', match.id);

  // Note: We cannot clear the cookie in a Server Component rendering phase.
  // We simply let it naturally expire in 15 mins. Since they now have an owner_id, 
  // they will bypass this cookie check on future visits anyway.
  return <>{children}</>;
}
