# Architectural Boundaries & Tech Stack
* **Stack:** Next.js (App Router), Tailwind CSS, Supabase, Netlify.
* **AI Restriction:** `@xenova/transformers` MUST ONLY be used for client-side semantic search via a Web Worker. No generative text LLMs or conversational chatbots.
* **SEO:** `app/directory/page.tsx` MUST utilize Server Components.
* **Data Ingestion:** Initial CSV seeding will be handled via a secure Node script. The script must programmatically convert Google Drive `open?id=` links to direct download links and upload them to a Supabase bucket.
* **Auth:** Supabase Google OAuth only. Edit rights are verified if the Google Authenticated email matches the `owner_email` database column.
