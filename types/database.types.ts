export interface Business {
  id: string;
  owner_id: string | null;
  owner_profile_id?: string | null; // Added in Phase 1 normalization
  owner_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  owner_phone: string | null;
  brand_name: string | null;
  category: string | null;
  description: string | null;
  services: string[] | null; // JSONB
  special_offer: string | null;
  address: string | null;
  tagline: string | null;
  website_url: string | null;
  logo_url: string | null;
  primary_image_url: string | null;
  gallery_urls: string[] | null; // JSONB
  sponsorship_tier: number | null;
  ym_region: string | null;
  ym_zone?: string | null;
  ym_district?: string | null;
  ym_club: string | null;
  ym_designation: string | null;
  imis_id: string | null;
  brochure_url?: string | null;
  owner_email?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export type AppRole = 'super_admin' | 'region_admin' | 'business_owner' | 'member';

export interface Profile {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string;
  phone: string | null;
  club: string | null;
  app_role: AppRole;
  created_at: string;
  imis_id?: string | null;
  ym_region?: string | null;
  ym_district?: string | null;
  ym_zone?: string | null;
  ym_club?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  education?: string | null;
  job_title?: string | null;
}

