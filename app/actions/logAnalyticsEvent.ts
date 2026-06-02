"use server";

import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { createHash } from "crypto";

// Initialize a service-role bypass client to log analytics events and run verification safely
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Logs a background analytics event (view or referral) for a business spotlight page.
 * Hashes client IP to comply with GDPR, and prevents spam/abuse via 24h rate-limiting.
 */
export async function logAnalyticsEvent(
  businessId: string,
  referrerProfileId: string | null
): Promise<{ success: boolean; reason?: string }> {
  try {
    if (!businessId) {
      return { success: false, reason: "Missing business ID" };
    }

    // 1. Resolve client IP address securely from headers
    const reqHeaders = await headers();
    const rawIp = reqHeaders.get("x-forwarded-for")?.split(",")[0] || 
                  reqHeaders.get("x-real-ip") || 
                  "127.0.0.1";

    // 2. Hash IP address using SHA-256 for secure, non-reversible PII storage
    const ipHash = createHash("sha256").update(rawIp).digest("hex");

    // 3. Resolve the business detail to inspect ownership parameters
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("owner_profile_id")
      .eq("id", businessId)
      .single();

    if (bizError || !business) {
      return { success: false, reason: "Target business not found" };
    }

    // 4. Resolve event type: Is it a unique referral or standard impression?
    let eventType: "view" | "referral" = "view";
    let validReferrerId: string | null = null;

    if (referrerProfileId && referrerProfileId.trim().length > 0) {
      // Validate referrer UUID format and ensure it is not the business owner
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(referrerProfileId) && referrerProfileId !== business.owner_profile_id) {
        // Double-check if the referrer profile exists in public.profiles
        const { data: referrer, error: refError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", referrerProfileId)
          .single();

        if (!refError && referrer) {
          eventType = "referral";
          validReferrerId = referrer.id;
        }
      }
    }

    // 5. 24-Hour Abuse Rate Limiting
    // Checks if the same IP hash has logged the same event type on this business in the last 24 hours.
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: existingEvent, error: rateError } = await supabase
      .from("analytics_events")
      .select("id")
      .eq("business_id", businessId)
      .eq("ip_hash", ipHash)
      .eq("event_type", eventType)
      .gt("created_at", oneDayAgo)
      .limit(1);

    if (rateError) {
      console.error("Rate-limit check database error:", rateError);
    }

    if (existingEvent && existingEvent.length > 0) {
      // Duplication caught: rate-limiting bypass active
      return { success: true, reason: "Duplicate skipped via 24h rate-limiting filter." };
    }

    // 6. Log the validated event into analytics_events
    const { error: insertError } = await supabase
      .from("analytics_events")
      .insert({
        event_type: eventType,
        business_id: businessId,
        referrer_profile_id: validReferrerId,
        ip_hash: ipHash,
      });

    if (insertError) {
      console.error("Failed to log analytics event:", insertError);
      return { success: false, reason: insertError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("logAnalyticsEvent failed:", error);
    return { success: false, reason: error.message || "An unexpected error occurred." };
  }
}
