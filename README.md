# YMBD

YMBD is the Y's Men's Business Directory and approval-based member platform for Y's Men International, South West India Region (SWIR).

> For complete architecture, security, onboarding, database and deployment context, see [`docs/YMBD_SOURCE_OF_TRUTH.md`](docs/YMBD_SOURCE_OF_TRUTH.md).

## Local Development

Prerequisites: Node.js, npm, and environment values based on `.env.example`.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Checks

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Database pgTAP tests require a disposable local Supabase/Docker environment; see [`supabase/tests/README.md`](supabase/tests/README.md). Never point tests or unreviewed SQL at production.

## Deployment

The Next.js application is configured for Netlify. Supabase migrations are reviewed forward-only SQL files and are executed manually by the project owner. Approval-onboarding sequencing is documented in [`docs/ONBOARDING_DEPLOYMENT_GUIDE.md`](docs/ONBOARDING_DEPLOYMENT_GUIDE.md).

Do not edit applied migrations, expose service-role secrets, or infer hosted database state from repository file presence.
