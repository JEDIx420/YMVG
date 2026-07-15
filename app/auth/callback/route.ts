import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSafeRedirect } from './redirectHelper'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next')
  const next = getSafeRedirect(rawNext)

  if (code) {
    const cookieStore = await cookies()
    let response = NextResponse.redirect(`${origin}${next}`)
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: accessApproved, error: activationError } = await supabase.rpc(
        'activate_approved_member'
      )

      if (!activationError && accessApproved === true) {
        return response
      }

      console.error('Approved-member activation denied:', activationError)
      response = NextResponse.redirect(`${origin}/access-not-approved`)
      await supabase.auth.signOut()
      return response
    }

    console.error('Auth callback exchange failed:', error)
  }

  return NextResponse.redirect(`${origin}/auth/auth-error?error=unauthorized`)
}
