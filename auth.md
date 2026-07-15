# YMI Auth & Session Management Specification

> **Historical document:** This predates approval-based signup and migration `022`. Its open Google-only provisioning and `region_admin` descriptions are not current. Use [`docs/YMBD_SOURCE_OF_TRUTH.md`](docs/YMBD_SOURCE_OF_TRUTH.md) for active authentication and permissions.

This document outlines the Authentication, Authorization, and Session Management processes for the YMI South West India Region (SWIR) Business Directory.

---

## 1. The Login Flow

The authentication process relies on **Supabase Auth** using **Google OAuth**.

### Login Trigger
Located in `components/AuthButton.tsx`, the `handleSignIn` function triggers the provider redirect:

```typescript
const handleSignIn = async () => {
  setLoading(true)
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${location.origin}/auth/callback`,
    },
  })
}
```

### Callback Handler
The callback is processed in `app/auth/callback/route.ts`, which exchanges the temporary code for a persistent session and redirects back to the dashboard or origin:

```typescript
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-error?error=ExchangeFailed`)
}
```

---

## 2. Session Management & Middleware

### Middleware Protection
We utilize Next.js Middleware in `middleware.ts` (using `@supabase/ssr`) to handle session refreshing via cookies and enforce route security.

```typescript
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()
  return supabaseResponse
}
```

### Session & Role Validation
Protected dashboard pages validate both the session and the user's role server-side using the `getCurrentProfile()` action:

```typescript
const profile = await getCurrentProfile();
if (!profile) {
  redirect("/");
}
```

---

## 3. Database Structure & Roles

### The `profiles` Table
Every authenticated user has a corresponding record in the `public.profiles` table. This record is automatically created via a Supabase database trigger when a user completes their first Google OAuth sign-in.

### Role Escalation Flow
Users are assigned roles that control their interface capabilities:

1.  **`member`**: The default role assigned to new sign-ups. Members can participate in referrals and manage their basic user profile.
2.  **`business_owner`**: Escalated automatically when a member registers a business listing or claims an administrative pre-populated listing. This role gives them access to listing tools and the Lead CRM.
3.  **`region_admin` / `super_admin`**: Administrative roles managing directory listings, user permissions, and campaign sponsorships.

---

## 4. Routing Structure

- **Login Trigger**: Rendered within the header via the `<AuthButton />` component.
- **Protected Area**: `/dashboard` enforces authentication and routes users to role-specific layouts (`MemberView`, `BusinessOwnerView`, or `AdminView`).
- **Authorization Errors**: Users experiencing callback issues are automatically routed to `/auth/auth-error` with descriptive error details.
