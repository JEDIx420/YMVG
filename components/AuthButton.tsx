"use client";

import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { useState } from 'react'

export default function AuthButton({ user }: { user: User | null }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          {user.email}
        </span>
        <button
          onClick={handleSignOut}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold py-2 px-4 border border-gray-300 rounded shadow transition-colors"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors ${loading ? 'opacity-50' : ''}`}
    >
      {loading ? 'Redirecting...' : 'Sign In with Google'}
    </button>
  )
}
