"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import {
  registrationRequestSchema,
  registrationReviewSchema,
} from "@/lib/validation/registration";

export type RegistrationActionResult = {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function submitRegistrationRequest(rawPayload: unknown): Promise<RegistrationActionResult> {
  const parsed = registrationRequestSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please review the highlighted registration details.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_registration_request", {
    p_full_name: parsed.data.full_name,
    p_email: parsed.data.email,
    p_phone: parsed.data.phone,
    p_club_id: parsed.data.club_id,
    p_member_imis_id: parsed.data.member_imis_id,
    p_address: parsed.data.address,
    p_city: parsed.data.city,
    p_state: parsed.data.state,
    p_country: parsed.data.country,
    p_education: parsed.data.education,
    p_job_title: parsed.data.job_title,
  });

  if (error) {
    console.error("Registration request submission failed:", error);
    return { success: false, error: "Unable to submit the request. Please try again." };
  }

  return {
    success: true,
    message: data || "If eligible, your registration request has been received for review.",
  };
}

export async function reviewRegistrationRequest(rawPayload: unknown): Promise<RegistrationActionResult> {
  const parsed = registrationReviewSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid review request." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const { data, error } = await supabase.rpc("review_registration_request", {
    p_request_id: parsed.data.request_id,
    p_requested_action: parsed.data.requested_action,
    p_rejection_reason: parsed.data.rejection_reason || null,
    p_corrected_club_id: parsed.data.corrected_club_id || null,
  });

  if (error) {
    console.error("Registration review failed:", error);
    return { success: false, error: "The registration request could not be reviewed." };
  }

  revalidatePath("/dashboard/users");
  return { success: true, message: data || "Registration request updated." };
}

const initialClubSchema = z.object({ club_id: z.string().uuid() }).strict();

export async function setMyInitialClub(rawPayload: unknown): Promise<RegistrationActionResult> {
  const parsed = initialClubSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return { success: false, error: "Select a valid SWIR club." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const { data, error } = await supabase.rpc("set_my_initial_club", {
    p_club_id: parsed.data.club_id,
  });

  if (error) {
    console.error("Initial club assignment failed:", error);
    return { success: false, error: "Club affiliation could not be saved." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/onboarding");
  return { success: true, message: data || "Club affiliation saved." };
}
