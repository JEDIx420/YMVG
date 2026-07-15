# Project Goal & Hardened Scope
Build a secure, privacy-first, highly-performant business directory for Y's Men International (SWIR).

**Primary User Journeys:**
1. **Public Visitors / Y's Men Members:** Browse the directory, view static informational pages (History, Leadership, Calendar), search for specific listings using secure PostgreSQL-native Keyword search, and submit inquiries to listings.
2. **Business Owners:** Edit and manage their business profile details, view analytics, and manage advertising boost requests.
3. **Reviewers (review_admin):** Review and moderate ad campaigns, audit listings, and view directory metrics.
4. **Super Administrators (super_admin):** Execute role assignments, manage system configurations, edit any listing, and delete campaigns.

**Success Metrics:** Sub-second page loads, SEO indexing of directory items via Server-Side Rendering (SSR), complete data isolation between user profiles, and robust trigger-enforced protection against role escalation.
