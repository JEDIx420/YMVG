-- YMI SWIR Business Directory - Phase 1 Migration
-- Enums, Normalized Tables, Security Role Helper, RLS Policies, and Auth Sync Triggers

-- 1. Create app_role enum type safely (preventing failure if already exists)
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('super_admin', 'region_admin', 'business_owner', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create profiles table (normalized user accounts)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text,
  email text NOT NULL UNIQUE,
  phone text,
  club text,
  app_role app_role DEFAULT 'member'::app_role NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create analytics_events table (referrals & clicks tracker)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text CHECK (event_type IN ('view', 'referral')) NOT NULL,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  referrer_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create performance indices for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_business ON public.analytics_events(business_id);
CREATE INDEX IF NOT EXISTS idx_analytics_referrer ON public.analytics_events(referrer_profile_id);

-- 4. Create ad_campaigns table (sponsored listings & search boosts)
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  status text CHECK (status IN ('draft', 'pending', 'active', 'paused', 'expired')) DEFAULT 'draft' NOT NULL,
  boost_multiplier float DEFAULT 1.0 NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster active campaign lookups
CREATE INDEX IF NOT EXISTS idx_ad_campaign_business ON public.ad_campaigns(business_id);

-- 5. Add owner_profile_id to businesses table
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_owner_profile ON public.businesses(owner_profile_id);

-- 6. SECURITY DEFINER role-helper function
-- This helper checks a user's role from public.profiles using auth.uid()
-- SECURITY DEFINER makes it run with system role privileges (bypassing RLS), which
-- completely eliminates policy infinite recursion errors when evaluating policies on public.profiles.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT app_role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- 7. Enable Row-Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Clean recreate of Row-Level Security policies to prevent duplicate/invalid states
DROP POLICY IF EXISTS select_profiles ON public.profiles;
DROP POLICY IF EXISTS update_profiles ON public.profiles;
DROP POLICY IF EXISTS insert_analytics ON public.analytics_events;
DROP POLICY IF EXISTS select_analytics ON public.analytics_events;
DROP POLICY IF EXISTS select_ad_campaigns ON public.ad_campaigns;
DROP POLICY IF EXISTS insert_ad_campaigns ON public.ad_campaigns;
DROP POLICY IF EXISTS update_ad_campaigns ON public.ad_campaigns;
DROP POLICY IF EXISTS update_businesses_owner_or_admin ON public.businesses;

-- Profiles Table RLS Policies
-- Owners can read their own profile; super_admins and region_admins can read all profiles.
CREATE POLICY select_profiles ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  OR public.get_my_role() IN ('super_admin'::app_role, 'region_admin'::app_role)
);

-- Users can only modify their own profile data.
CREATE POLICY update_profiles ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Analytics Events Table RLS Policies
-- Public anonymous client-side mounts can log impression/referral events.
CREATE POLICY insert_analytics ON public.analytics_events FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Admins and the specific business owner can view the collected metrics.
CREATE POLICY select_analytics ON public.analytics_events FOR SELECT TO authenticated
USING (
  public.get_my_role() IN ('super_admin'::app_role, 'region_admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_id AND b.owner_id = auth.uid()
  )
);

-- Ad Campaigns Table RLS Policies
-- Admins and the listing owner can read campaign information.
CREATE POLICY select_ad_campaigns ON public.ad_campaigns FOR SELECT TO authenticated
USING (
  public.get_my_role() IN ('super_admin'::app_role, 'region_admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_id AND b.owner_id = auth.uid()
  )
);

-- Listing owners can create campaign drafts.
CREATE POLICY insert_ad_campaigns ON public.ad_campaigns FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_id AND b.owner_id = auth.uid()
  )
);

-- Admins can update any campaign status (e.g. approve/activate/pause).
-- Listing owners can only update campaigns if they are in 'draft' status.
CREATE POLICY update_ad_campaigns ON public.ad_campaigns FOR UPDATE TO authenticated
USING (
  public.get_my_role() IN ('super_admin'::app_role, 'region_admin'::app_role)
  OR (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
    AND status = 'draft'
  )
);

-- Businesses Table RLS Modification for Administrative and Role-based updates
CREATE POLICY update_businesses_owner_or_admin ON public.businesses FOR UPDATE TO authenticated
USING (
  owner_id = auth.uid()
  OR public.get_my_role() = 'super_admin'::app_role
  -- Region Admin can edit listings within their assigned club's region
  OR (
    public.get_my_role() = 'region_admin'::app_role
    AND ym_region = (SELECT club FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- 8. Auto-Onboarding trigger for auth.users creation
-- Whenever a Google OAuth login finishes and creates a user, this trigger automatically
-- provisions their profile record as a 'member', except the hardcoded super_admin.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, app_role)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    CASE 
      WHEN new.email = 'jayanand.jayakumar@gmail.com' THEN 'super_admin'::app_role
      ELSE 'member'::app_role
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup trigger if re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
