"use server";

import { Resend } from "resend";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { LeadEmail } from "@/components/emails/LeadEmail";
import { render } from "@react-email/render";
import React from "react";

// Initialize Resend with API Key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

const leadSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone number is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  businessId: z.string(),
});

export async function sendLead(formData: z.infer<typeof leadSchema>) {
  try {
    // 1. Validate form data
    const validatedData = leadSchema.parse(formData);
    const supabase = await createClient();

    // 2. Fetch business contact email and brand name
    const { data: business, error: dbError } = await supabase
      .from("businesses")
      .select("contact_email, brand_name")
      .eq("id", validatedData.businessId)
      .single();

    if (dbError || !business?.contact_email) {
      return { 
        success: false, 
        error: "Business contact email not found. Please try again later." 
      };
    }

    // 3. Manual Rendering for React 19 Compatibility
    // This bypasses Resend's internal legacy render methods that throw "render is not a function"
    const htmlContent = await render(React.createElement(LeadEmail, {
      senderName: validatedData.name,
      senderEmail: validatedData.email,
      senderPhone: validatedData.phone,
      message: validatedData.message,
      businessName: business.brand_name || "your business",
    }));

    // 4. Dispatch email via Resend
    const sender = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    
    const { error: emailError } = await resend.emails.send({
      from: `YM SWIR Leads <${sender}>`,
      to: [business.contact_email],
      subject: `New Lead: ${validatedData.name} regarding ${business.brand_name}`,
      html: htmlContent,
    });

    if (emailError) {
      console.error("Resend Error:", emailError);
      return { success: false, error: "Failed to send email. Please try again later." };
    }

    return { success: true };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0].message };
    }
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
