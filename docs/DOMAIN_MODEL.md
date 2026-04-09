# Database Schema & RLS
**Table: businesses**
`id` (UUID), `created_at` (Timestamptz), `imis_id` (Text), `owner_name` (Text), `owner_email` (Text), `business_name` (Text), `category` (Text), `core_services` (Text), `description` (Text), `tagline` (Text), `special_offer` (Text), `address` (Text), `phone` (Text), `website` (Text), `logo_url` (Text), `photo_url` (Text), `zone` (Text), `embedding` (vector(384)).

**Table: leads**
`id` (UUID), `created_at` (Timestamptz), `business_id` (UUID, FK), `sender_name` (Text), `sender_email` (Text), `message` (Text).

**RLS Policies (businesses):**
1. Public Read: `FOR SELECT USING (true)`
2. Admin Full Access: `USING (auth.jwt() ->> 'email' = 'jayanand.jayakumar@gmail.com')`
3. Owner Update: `FOR UPDATE USING (auth.jwt() ->> 'email' = owner_email)`
