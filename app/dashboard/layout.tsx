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

  // Check 2: VIP Flow Validation
  // Read the cookie. If it's not present, we assume they bypassed the IMIS check.
  const cookieStore = await cookies();
  const imisId = cookieStore.get('imis_id')?.value;

  if (!imisId) {
    // Missing cookie. Could be direct URL entry or expired.
    await supabase.auth.signOut();
    redirect('/unauthorized');
  }

  // Use the cookie to find the matching business with this email.
  // Note: user.email could be undefined for phone signups, but we use Google OAuth so it's guaranteed.
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
  // Self-Healing: If owner_id is empty, link this business to the user
  if (!match.owner_id) {
    await supabase
      .from('businesses')
      .update({ owner_id: user.id, owner_name: user.user_metadata?.full_name || null })
      .eq('id', match.id);
  }

  // Clear the imis_id cookie, we have validated them for this session
  // Setting Max-Age to 0 essentially deletes the cookie
  cookieStore.set('imis_id', '', { maxAge: 0, path: '/' });

  return <>{children}</>;
}
