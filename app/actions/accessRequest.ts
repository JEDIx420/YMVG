"use server";

import { Resend } from "resend";

export async function sendAccessRequest(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const location = formData.get("location") as string;
    const email = formData.get("email") as string;
    
    if (!name || !phone || !location || !email) {
      return { success: false, error: "Please provide all required fields." };
    }

    const sender = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const { error } = await resend.emails.send({
      from: `YMI Directory <${sender}>`,
      to: "jayanand.jayakumar@gmail.com",
      subject: "New Y's Men Enrollment Application",
      html: `
        <h2>New Y's Men Application</h2>
        <p>A person has requested access to become a Y's Men member. Please review their details and contact them if interested.</p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Phone:</strong> ${phone}</li>
          <li><strong>Location/Address:</strong> ${location}</li>
        </ul>
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
