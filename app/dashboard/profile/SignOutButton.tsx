'use client'

import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <button type="button" className="btn btn--outline" onClick={handleSignOut}>
      Sign Out
    </button>
  )
}