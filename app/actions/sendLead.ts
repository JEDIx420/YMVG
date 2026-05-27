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
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0].message };
    }
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
