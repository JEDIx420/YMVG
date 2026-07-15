"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

// Strict validation schema rejecting unknown fields
const businessInputSchema = z.object({
  brand_name: z.string().min(2, "Brand name is required").max(100),
  category: z.string().min(2, "Category is required").max(50),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  services: z.array(z.string().max(50)).nullable().optional(),
  special_offer: z.string().max(500).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  contact_phone: z.string().max(30).nullable().optional(),
  contact_email: z.string().email("Invalid email format").or(z.literal("")).nullable().optional(),
  website_url: z.string().url("Invalid website URL format").or(z.literal("")).nullable().optional(),
  logo_url: z.string().url("Invalid logo URL format").or(z.literal("")).nullable().optional(),
  primary_image_url: z.string().url("Invalid primary image URL format").or(z.literal("")).nullable().optional(),
  gallery_urls: z.array(z.string().url("Invalid gallery image URL")).nullable().optional(),
  brochure_url: z.string().url("Invalid brochure URL format").or(z.literal("")).nullable().optional(),
  tagline: z.string().max(150).nullable().optional(),
  ym_designation: z.string().max(100).nullable().optional(),
}).strict();

export async function addBusiness(
  rawPayload: unknown
): Promise<{ success: boolean; id?: string; error?: string }> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    // 1. Authenticate user server-side
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication failed. Please log in again." };
    }

    // 2. Validate input and reject unknown fields
    const validated = businessInputSchema.parse(rawPayload);

    // 3. Insert via RPC create_my_business (all ownership details resolved DB-side)
    const { data: newBusinessId, error } = await supabase.rpc("create_my_business", {
      brand_name: validated.brand_name,
      category: validated.category,
      description: validated.description,
      services: validated.services || null,
      special_offer: validated.special_offer || null,
      address: validated.address || null,
      city: validated.city || null,
      state: validated.state || null,
      country: validated.country || null,
      contact_phone: validated.contact_phone || null,
      contact_email: validated.contact_email || null,
      website_url: validated.website_url || null,
      logo_url: validated.logo_url || null,
      primary_image_url: validated.primary_image_url || null,
      gallery_urls: validated.gallery_urls || null,
      brochure_url: validated.brochure_url || null,
      tagline: validated.tagline || null,
      ym_region: null,
      ym_club: null,
      ym_district: null,
      ym_zone: null,
      ym_designation: validated.ym_designation || null,
    });

    if (error) {
      console.error("Database RPC create_my_business Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: newBusinessId };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0].message };
    }
    console.error("addBusiness pipeline failed:", err);
    return { success: false, error: "An unexpected error occurred during the business submission." };
  }
}
