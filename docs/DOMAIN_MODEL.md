# Database Schema & RLS

## 1. Table: `businesses`
* `id` (UUID, PK)
* `owner_id` (UUID, nullable)
* `owner_name` (Text, nullable)
* `contact_email` (Text, nullable) - **Use this for OAuth claim matching**
* `contact_phone` (Text, nullable)
* `owner_phone` (Text, nullable)
* `brand_name` (Text, nullable)
* `category` (Text, nullable)
* `description` (Text, nullable)
* `services` (JSONB / Array of Text, nullable)
* `special_offer` (Text, nullable)
* `address` (Text, nullable)
* `tagline` (Text, nullable)
* `website_url` (Text, nullable)
* `logo_url` (Text, nullable)
* `primary_image_url` (Text, nullable)
* `gallery_urls` (JSONB / Array of Text, nullable)
* `sponsorship_tier` (Integer, nullable)
* `ym_region` (Text, nullable)
* `ym_club` (Text, nullable)
* `ym_designation` (Text, nullable)
* `embedding` (vector(384), nullable)

## 2. Table: `leads`
* `id` (UUID, PK)
* `created_at` (Timestamptz)
* `business_id` (UUID, FK to businesses.id)
* `sender_name` (Text)
* `sender_email` (Text)
* `message` (Text)

## 3. Security (Row Level Security - RLS)
Hardcoded Admin Email: `jayanand.jayakumar@gmail.com`

**Policies for `businesses`:**
1. Public Read: `CREATE POLICY "Public profiles viewable by everyone" ON businesses FOR SELECT USING (true);`
2. Admin CRUD: `CREATE POLICY "Admin full access" ON businesses USING (auth.jwt() ->> 'email' = 'jayanand.jayakumar@gmail.com');`
3. Owner Update: `CREATE POLICY "Owners update own business" ON businesses FOR UPDATE USING (auth.jwt() ->> 'email' = contact_email);`
