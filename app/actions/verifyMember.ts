'use server';

import { createClient } from '@supabase/supabase-js';

export async function verifyMemberCredentials(imisId: string, email: string) {
  // We MUST use the admin client here to bypass RLS for an unauthenticated user
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('imis_id', imisId)
      .ilike('owner_email', email)
      .single();

    if (error || !data) return { isValid: false };
    return { isValid: true };
  } catch (error) {
    console.error("Verification error:", error);
    return { isValid: false };
  }
}
