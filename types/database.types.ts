export type AppRole = 'super_admin' | 'admin' | 'review_admin' | 'region_admin' | 'business_owner' | 'member';

export interface Business {
  id: string;
  club_id?: string | null;
  owner_id: string | null;
  owner_profile_id?: string | null;
  owner_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  owner_phone: string | null;
  brand_name: string | null;
  category: string | null;
  description: string | null;
  services: string[] | null;
  special_offer: string | null;
  address: string | null;
  tagline: string | null;
  website_url: string | null;
  logo_url: string | null;
  primary_image_url: string | null;
  gallery_urls: string[] | null;
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

export interface PublicBusiness {
  id: string;
  brand_name: string | null;
  owner_name: string | null;
  category: string | null;
  description: string | null;
  services: string[] | null;
  special_offer: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  website_url: string | null;
  logo_url: string | null;
  primary_image_url: string | null;
  gallery_urls: string[] | null;
  brochure_url?: string | null;
  tagline: string | null;
  sponsorship_tier: number | null;
  ym_region: string | null;
  ym_zone?: string | null;
  ym_district?: string | null;
  ym_club: string | null;
  ym_designation: string | null;
}

export interface Profile {
  id: string;
  user_id: string | null;
  club_id?: string | null;
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
  account_approved_at?: string | null;
}

export interface SwirClub {
  id: string;
  imis_club_id: string;
  canonical_name: string;
  club_type: string;
  district_number: number;
  zone_number: number;
  region_code: "SWIR";
}

export type RegistrationRequestStatus = "pending" | "approved" | "rejected" | "activated";

export interface RegistrationRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  member_imis_id: string | null;
  club_id: string;
  club_name: string;
  imis_club_id: string;
  district_number: number;
  zone_number: number;
  region_code: "SWIR";
  submitted_at: string;
  status: RegistrationRequestStatus;
  reviewed_at: string | null;
  reviewer_name: string | null;
  rejection_reason: string | null;
}

export interface RoleAudit {
  id: string;
  target_profile_id: string;
  previous_role: AppRole;
  new_role: AppRole;
  changed_by_profile_id: string;
  changed_at: string;
}

export interface AdCampaign {
  id: string;
  business_id: string;
  campaign_type: 'search_boost' | 'homepage_patron';
  boost_multiplier: number;
  status: 'draft' | 'pending' | 'active' | 'paused' | 'expired' | 'rejected';
  start_date: string;
  end_date: string;
  payment_proof_url?: string | null;
  created_at: string;
}
