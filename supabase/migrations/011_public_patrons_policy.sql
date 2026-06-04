-- Phase 8 Bug Fix: Allow public SELECT visibility for Homepage Patrons

-- Clean recreate of Row-Level Security policies to prevent duplicate/invalid states
DROP POLICY IF EXISTS select_public_patron_ad_campaigns ON public.ad_campaigns;

-- Policy: Allow SELECT access to public (anon) and authenticated roles where campaign is active and type is homepage_patron
CREATE POLICY select_public_patron_ad_campaigns ON public.ad_campaigns 
    FOR SELECT 
    TO anon, authenticated
    USING (status = 'active' AND campaign_type = 'homepage_patron');
