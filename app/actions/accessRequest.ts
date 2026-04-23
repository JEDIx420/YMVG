"use server";

import { Resend } from "resend";

export async function sendAccessRequest(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const club = formData.get("club") as string;
    const email = formData.get("email") as string;
    
    if (!name || !phone || !club || !email) {
      return { success: false, error: "Please provide all required fields." };
    }

    const { error } = await resend.emails.send({
      from: "YMI Directory <noreply@ymiswir.com>", // Update domain as needed
      to: "admin@ymiswir.com",
      subject: "New Dashboard Access Request - VIP Bouncer Match Failure",
      html: `
        <h2>New Access Request</h2>
        <p>A member has failed the VIP matching step and requested manual verification.</p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Google OAuth Email used:</strong> ${email}</li>
          <li><strong>Phone:</strong> ${phone}</li>
          <li><strong>YMI Club:</strong> ${club}</li>
        </ul>
        <br/>
        <p>Please cross-reference this information with the pre-populated businesses sheet to verify their identity and update their contact_email appropriately.</p>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return { success: false, error: "Failed to send the request via email service." };
    }

    return { success: true };
  } catch (err) {
    console.error("sendAccessRequest Error:", err);
    return { success: false, error: "An unexpected error occurred while processing the request." };
  }
}
