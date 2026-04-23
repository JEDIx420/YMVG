export interface Business {
  id: string;
  owner_id: string | null;
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
  ym_club: string | null;
  ym_designation: string | null;
  imis_id: string | null;
  embedding: number[] | null;
}
