"use server";

import { Resend } from "resend";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/admin";
import { LeadEmail } from "@/components/emails/LeadEmail";
import { render } from "@react-email/render";
import React from "react";

// Initialize Resend with API Key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

const leadSchema = z.object({
  name: z.string().min(2, "Name is required").max(100, "Name must be under 100 characters"),
  email: z.string().email("Invalid email address").max(100, "Email must be under 100 characters"),
  phone: z.string().min(5, "Phone number is required").max(30, "Phone number must be under 30 characters"),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000, "Message must be under 1000 characters"),
  businessId: z.string().uuid("Invalid business ID"),
  token: z.string().optional().nullable(),
}).strict();

export async function sendLead(formData: z.infer<typeof leadSchema>) {
  try {
    // 1. Validate form data
    const validatedData = leadSchema.parse(formData);

    // 2. Validate Turnstile only when explicitly enabled.
    const turnstileEnabled = process.env.TURNSTILE_ENABLED === "true";
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;

    if (turnstileEnabled) {
      if (!turnstileSecret || turnstileSecret === "your_turnstile_secret_key") {
        console.error("TURNSTILE_SECRET_KEY is missing while Turnstile is enabled.");
        return { success: false, error: "System configuration error. Please contact administration." };
      }
      if (!validatedData.token) {
        return { success: false, error: "Security validation token is missing." };
      }
      const verifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
      const verifyResponse = await fetch(verifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${encodeURIComponent(turnstileSecret)}&response=${encodeURIComponent(validatedData.token)}`
      });
      const verifyOutcome = await verifyResponse.json();
      if (!verifyOutcome.success) {
        return { success: false, error: "Security validation failed. Please refresh and try again." };
      }
    }

    const supabase = createAdminClient();

    // 3. Fetch business contact email and brand name
    const { data: business, error: dbError } = await supabase
      .from("businesses")
      .select("contact_email, owner_email, brand_name")
      .eq("id", validatedData.businessId)
      .single();

    const targetEmail = business?.contact_email || business?.owner_email;

    if (dbError || !targetEmail) {
      return { 
        success: false, 
        error: "Business contact email not found. Please try again later." 
      };
    }

    // 4. Store lead in public.leads database
    const { error: insertLeadError } = await supabase
      .from("leads")
      .insert({
        business_id: validatedData.businessId,
        sender_name: validatedData.name,
        sender_email: validatedData.email,
        sender_phone: validatedData.phone,
        message: validatedData.message
      });

    if (insertLeadError) {
      console.error("Failed to store lead in database:", insertLeadError);
      return {
        success: false,
        error: "Failed to submit inquiry. Please try again later."
      };
    }

    // 5. Manual Rendering for React 19 Compatibility
    const htmlContent = await render(React.createElement(LeadEmail, {
      senderName: validatedData.name,
      senderEmail: validatedData.email,
      senderPhone: validatedData.phone,
      message: validatedData.message,
      businessName: business.brand_name || "your business",
    }));

    // 6. Dispatch email via Resend
    try {
      const { error: emailError } = await resend.emails.send({
        from: "Y's Men's International Directory <leads@ymidirectory.com>",
        to: [targetEmail],
        bcc: ['jayanand.jayakumar@gmail.com'],
        subject: `New Lead: ${validatedData.name} regarding ${business.brand_name}`,
        html: htmlContent,
      });

      if (emailError) {
        console.error("RESEND_ERROR:", emailError);
        return { success: false, error: "Failed to send email. Please try again later." };
      }

      return { success: true };
    } catch (sendErr) {
      console.error("RESEND_ERROR:", sendErr);
      return { success: false, error: "Failed to send email. Please try again later." };
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0].message };
    }
    const errMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: errMsg };
  }
}
