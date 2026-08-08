'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './banned.module.css'

function formatRemaining(ms: number) {
  if (ms <= 0) return 'Ban expired — refresh the page'
  const days = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${days}d ${hours}h ${minutes}m ${seconds}s`
}

export default function CountdownDisplay({ bannedUntil }: { bannedUntil: string }) {
  const [remaining, setRemaining] = useState(new Date(bannedUntil).getTime() - Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(new Date(bannedUntil).getTime() - Date.now())
    }, 1000)
    return () => clearInterval(id)
  }, [bannedUntil])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div>
      <div className={styles.countdown}>{formatRemaining(remaining)}</div>
      <div className={styles.countdownLabel}>Time remaining</div>
      <button type="button" className="btn btn--outline" style={{ marginTop: 24 }} onClick={handleSignOut}>
        Sign Out
      </button>
    </div>
  )
}