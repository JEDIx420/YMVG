-- Migration: 017_public_directory_final_cutover
-- Purpose: Remove direct public table access, lock down leads, analytics and businesses, and configure RLS.
-- Assumptions: New frontend has been successfully deployed and verifies against the public view/search RPCs.
-- Transactional: Yes.
-- Dependencies: 016_public_directory_compatibility.sql
-- Expected Production Impact: Base table businesses and leads are completely hidden from anon. Strict API protection active.

-- 1. Lock down the base businesses table
-- Revoke all direct read access on businesses base table from anon and PUBLIC
REVOKE SELECT ON public.businesses FROM PUBLIC, anon;

-- Ensure RLS is active and enforced on businesses table
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Grant select on base table only to authenticated (for owner/reviewer dashboards)
GRANT SELECT ON public.businesses TO authenticated;

-- Setup exact security policies for businesses table
DROP POLICY IF EXISTS select_businesses ON public.businesses;
DROP POLICY IF EXISTS insert_businesses ON public.businesses;
DROP POLICY IF EXISTS update_businesses ON public.businesses;
DROP POLICY IF EXISTS delete_businesses ON public.businesses;

CREATE POLICY select_businesses ON public.businesses FOR SELECT TO authenticated
USING (
  owner_id = auth.uid()
  OR (SELECT app_role FROM public.profiles WHERE user_id = auth.uid()) IN ('super_admin'::public.app_role, 'review_admin'::public.app_role)
);

CREATE POLICY insert_businesses ON public.businesses FOR INSERT TO authenticated
WITH CHECK (
  owner_id = auth.uid()
);

CREATE POLICY update_businesses ON public.businesses FOR UPDATE TO authenticated
USING (
  owner_id = auth.uid()
  OR (SELECT app_role FROM public.profiles WHERE user_id = auth.uid()) = 'super_admin'::public.app_role
)
WITH CHECK (
  owner_id = auth.uid()
  OR (SELECT app_role FROM public.profiles WHERE user_id = auth.uid()) = 'super_admin'::public.app_role
);

CREATE POLICY delete_businesses ON public.businesses FOR DELETE TO authenticated
USING (
  (SELECT app_role FROM public.profiles WHERE user_id = auth.uid()) = 'super_admin'::public.app_role
);


-- 2. Lock down the public.leads table (CRM hardening)
-- Revoke direct insert/select/update/delete access from anon, authenticated and PUBLIC
REVOKE ALL PRIVILEGES ON public.leads FROM PUBLIC, anon, authenticated;

-- Grant select on leads only to authenticated users (so owners and reviewers can read through dashboard)
GRANT SELECT ON public.leads TO authenticated;

-- Setup exact security policies for leads table
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_leads ON public.leads;
DROP POLICY IF EXISTS insert_leads ON public.leads;
DROP POLICY IF EXISTS update_leads ON public.leads;
DROP POLICY IF EXISTS delete_leads ON public.leads;

CREATE POLICY select_leads ON public.leads FOR SELECT TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM public.businesses b 
    WHERE b.id = business_id AND b.owner_id = auth.uid()
  ))
  OR (SELECT app_role FROM public.profiles WHERE user_id = auth.uid()) IN ('super_admin'::public.app_role, 'review_admin'::public.app_role)
);


-- 3. Lock down the public.analytics_events table
-- Enable RLS and setup policies
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_analytics ON public.analytics_events;

CREATE POLICY select_analytics ON public.analytics_events FOR SELECT TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM public.businesses b 
    WHERE b.id = business_id AND b.owner_id = auth.uid()
  ))
  OR (SELECT app_role FROM public.profiles WHERE user_id = auth.uid()) IN ('super_admin'::public.app_role, 'review_admin'::public.app_role)
);


-- 4. Lock down the public.ad_campaigns table
-- Enable RLS and setup policies
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_campaigns ON public.ad_campaigns;
DROP POLICY IF EXISTS insert_campaigns ON public.ad_campaigns;
DROP POLICY IF EXISTS update_campaigns ON public.ad_campaigns;
DROP POLICY IF EXISTS delete_campaigns ON public.ad_campaigns;

CREATE POLICY select_campaigns ON public.ad_campaigns FOR SELECT TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM public.businesses b 
    WHERE b.id = business_id AND b.owner_id = auth.uid()
  ))
  OR (SELECT app_role FROM public.profiles WHERE user_id = auth.uid()) IN ('super_admin'::public.app_role, 'review_admin'::public.app_role)
);

CREATE POLICY insert_campaigns ON public.ad_campaigns FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses b 
    WHERE b.id = business_id AND b.owner_id = auth.uid()
  )
);

CREATE POLICY update_campaigns ON public.ad_campaigns FOR UPDATE TO authenticated
USING (
  (
    EXISTS (
      SELECT 1 FROM public.businesses b 
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
    AND status = 'draft'
  )
  OR (SELECT app_role FROM public.profiles WHERE user_id = auth.uid()) = 'super_admin'::public.app_role
)
WITH CHECK (
  (
    EXISTS (
      SELECT 1 FROM public.businesses b 
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
    AND status = 'draft'
  )
  OR (SELECT app_role FROM public.profiles WHERE user_id = auth.uid()) = 'super_admin'::public.app_role
);

CREATE POLICY delete_campaigns ON public.ad_campaigns FOR DELETE TO authenticated
USING (
  (SELECT app_role FROM public.profiles WHERE user_id = auth.uid()) = 'super_admin'::public.app_role
);


-- 5. Revoke legacy vector/NVIDIA search functions execution
-- Guessed signatures removed. Exact signatures must be copied from production and executed manually.
-- See supabase/manual/revoke_legacy_ymbd_vector_functions.sql for the cleanup template.


-- 6. Finalize view and search RPC grants
REVOKE ALL PRIVILEGES ON public.public_businesses FROM PUBLIC;
GRANT SELECT ON public.public_businesses TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.keyword_search_businesses(text, text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.keyword_search_businesses(text, text, text, integer) TO anon, authenticated;
