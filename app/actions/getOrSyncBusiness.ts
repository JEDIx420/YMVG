"use server";

import { createClient } from "@/utils/supabase/server";

export async function getOrSyncBusiness() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // 1. Check if user already owns a business
  const { data: existingOwned } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (existingOwned) {
    return { business: existingOwned };
  }

  // 2. Try to match by email if ownership isn't set yet
  if (user.email) {
    const { data: matchedBusiness, error: matchError } = await supabase
      .from("businesses")
      .update({ owner_id: user.id })
      .eq("contact_email", user.email)
      .is("owner_id", null)
      .select()
      .single();

    if (!matchError && matchedBusiness) {
      return { business: matchedBusiness };
    }
  }

  return { business: null };
}
