-- Phase 8 Migration: Leads CRM and Monetization Campaign Types

-- 1. Create public.leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  sender_phone text,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create performance index for queries
CREATE INDEX IF NOT EXISTS idx_leads_business ON public.leads(business_id);

-- 2. Enable Row-Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Clean recreate of Row-Level Security policies to prevent duplicate/invalid states
DROP POLICY IF EXISTS insert_leads ON public.leads;
DROP POLICY IF EXISTS select_leads ON public.leads;

-- Policy: Allow anonymous visitors or logged-in members to submit contact inquiries (insert leads)
CREATE POLICY insert_leads ON public.leads FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Policy: Allow admins or the respective business owner to read leads
CREATE POLICY select_leads ON public.leads FOR SELECT TO authenticated
USING (
  public.get_my_role() IN ('super_admin'::app_role, 'region_admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_id AND b.owner_id = auth.uid()
  )
);

-- 3. Alter public.ad_campaigns table
ALTER TABLE public.ad_campaigns ADD COLUMN IF NOT EXISTS campaign_type text NOT NULL DEFAULT 'search_boost' CHECK (campaign_type IN ('search_boost', 'homepage_patron'));
