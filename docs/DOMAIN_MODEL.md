# Database Schema, Roles & Row-Level Security (RLS)

## 1. Table: `profiles`
* `id` (UUID, PK) - Maps to unique profile records.
* `user_id` (UUID, FK, Unique, Nullable) - Link to `auth.users.id`.
* `email` (Text, Unique) - Registered user email address.
* `full_name` (Text, Nullable) - Display name.
* `phone` (Text, Nullable) - Member private contact number.
* `club` (Text, Nullable) - Local Club name.
* `app_role` (public.app_role Enum) - Tier levels: `member`, `business_owner`, `review_admin`, `super_admin`.
* `imis_id` (Text, Nullable) - International Member identification ID.
* *Columns `id`, `user_id`, `email`, `created_at`, `app_role` are immutable and protected by triggers.*

## 2. Table: `businesses`
* `id` (UUID, PK) - Primary identifier.
* `owner_id` (UUID, FK, Nullable) - Owner's user reference ID.
* `owner_profile_id` (UUID, FK to `profiles.id`) - Reference link to the owner profile.
* `owner_name` (Text) - Derived owner name.
* `owner_email` (Text) - Private owner email.
* `owner_phone` (Text) - Private owner phone.
* `brand_name` (Text) - Public brand name.
* `category` (Text) - Public category filter.
* `description` (Text) - Detailed public description.
* `services` (Text[]) - Service offerings.
* `special_offer` (Text) - Deals and discounts.
* `address`, `city`, `state`, `country` - Physical coordinates.
* `contact_email`, `contact_phone` - Public inquiry details.
* `website_url`, `logo_url`, `primary_image_url`, `gallery_urls`, `brochure_url` - Asset pointers.
* `sponsorship_tier` (Double Precision) - Sponsored boost level.
* `ym_region`, `ym_zone`, `ym_district`, `ym_club`, `ym_designation` - Y's Men International affiliations.

## 3. Table: `role_audit`
* `id` (UUID, PK) - Audit log unique identifier.
* `target_profile_id` (UUID, FK) - Target member profile receiving role modifications.
* `previous_role` (app_role) - Original role value.
* `new_role` (app_role) - Applied role value.
* `changed_by_profile_id` (UUID, FK) - Moderator profile ID performing the change.
* `changed_at` (Timestamptz) - Time of update.

## 4. Row-Level Security (RLS) & Views
* **Table `businesses`:**
  - `SELECT`: Restricted to authenticated owners, `review_admin`, and `super_admin`.
  - `INSERT`: Restricted to authenticated users mapping their own `owner_id`.
  - `UPDATE`: Restricted to authenticated owners and `super_admin`.
  - `DELETE`: Strictly restricted to `super_admin`.
* **View `public_businesses` (`security_barrier = true`):**
  - Exposes only intentionally public fields (e.g. brand, contacts, description). Hides all private profiles, `owner_id`, `owner_email`, and `imis_id`.
  - `SELECT` granted to `anon` and `authenticated`.
* **Table `profiles`:**
  - `SELECT`: Allowed for owner, `review_admin`, and `super_admin`.
  - `UPDATE`: Broad update revoked. Column-level update permissions granted only to authenticated owners on editable profile details (e.g. full_name, phone, club).
* **Table `leads`:**
  - `SELECT`: Scoped to business owners reading leads for their listing, `review_admin`, and `super_admin`.
  - `INSERT/UPDATE/DELETE`: Broad write permissions revoked from public client roles. Inserts must execute server-side via Server Actions utilizing the service role.
