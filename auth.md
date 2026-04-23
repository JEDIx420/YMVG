# YMI Auth & Session Management Analysis

This document outlines the current state of Authentication and Authorization for the YMI South West India Region (SWIR) Business Directory.

## 1. The Login Flow

The authentication process relies on **Supabase Auth** using **Google OAuth**.

### Login Trigger
Located in `components/AuthButton.tsx`, the `handleSignIn` function triggers the provider redirect:

```typescript
// components/AuthButton.tsx
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
The callback is processed in `app/auth/callback/route.ts`, which exchanges the temporary code for a persistent session and redirects back to the root:

```typescript
// app/auth/callback/route.ts
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/`)
    }
  }

  return NextResponse.json({ error: "Failed to exchange callback code" }, { status: 500 })
}
```

---

## 2. Session Management & Middleware

### Middleware Protection
We utilize Next.js Middleware in `middleware.ts` (using `@supabase/ssr`) to handle session refreshing via cookies.

```typescript
// middleware.ts
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

### Session Validation on Protected Pages
The `/dashboard` page validates the session server-side using the `createClient` utility from `utils/supabase/server.ts`.

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/"); // Standard redirect for unauthenticated users
  }
  
  // Business logic follow...
}
```

---

## 3. Database Structure

### Users & Profiles
There is currently **no dedicated profiles table** in the public schema. User metadata is accessed directly via `supabase.auth.getUser()`.

### Businesses Table
The `businesses` table handles the "ownership" link. Key columns for identity matching:

| Column | Type | Description |
| :--- | :--- | :--- |
| `owner_id` | `uuid` | Foreign key to `auth.users` ID (set after matching). |
| `contact_email` | `text` | The email used to match pre-populated records with authenticated users. |
| `brand_name` | `text` | The primary business name. |

---

## 4. Routing Structure

- **Login Trigger**: Embedded in `components/AuthButton.tsx` (rendered in the Header).
- **Dashboard**: `/dashboard` (Protected).
- **Unauthorized/Fallbacks**: Unauthenticated access to `/dashboard` redirects to `/`.
- **Match Errors**: Users who authenticate but have no matching business in the database are shown a "No Business Registered" view within `/dashboard`.

---

## Next Steps for Whitelist Implementation
1. Decide if the whitelist will be email-based (stored in a `whitelist` table) or boolean flagged in a `profiles` table.
2. Update `middleware.ts` or `app/dashboard/page.tsx` to check against the whitelist after `supabase.auth.getUser()`.
