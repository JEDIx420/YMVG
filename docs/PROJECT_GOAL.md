# Project Goal & Hardened Scope

> Authoritative current context: [`YMBD_SOURCE_OF_TRUTH.md`](YMBD_SOURCE_OF_TRUTH.md).

Build a secure, privacy-first, highly-performant business directory for Y's Men International (SWIR).

**Primary User Journeys:**
1. **Public Visitors:** Browse the directory and regional content, use PostgreSQL keyword search, submit enquiries, or apply for an account.
2. **Approved Members:** Sign in through approval-gated activation, maintain personal details and club affiliation, use referrals, and optionally create a business.
3. **Business Owners:** Edit and manage business profile details, view analytics and leads, and request advertising boosts.
4. **Reviewers (`review_admin`):** Review registrations and campaigns, correct club affiliation, audit listings, and view directory metrics without destructive authority.
5. **Super Administrators (`super_admin`):** Assign roles, edit/delete listings, delete campaigns, and access full audit surfaces.

**Success Metrics:** Sub-second page loads, SEO indexing of directory items via Server-Side Rendering (SSR), complete data isolation between user profiles, and robust trigger-enforced protection against role escalation.
