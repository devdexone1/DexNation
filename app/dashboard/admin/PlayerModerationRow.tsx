'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { banPlayerAction, mutePlayerAction } from './actions'
import styles from './admin.module.css'

export default function PlayerModerationRow({
  userId,
  nationName,
  canBan,
  canMute,
  maxBanDays,
}: {
  userId: string
  nationName: string
  canBan: boolean
  canMute: boolean
  maxBanDays: number
}) {
  const router = useRouter()
  const [banDays, setBanDays] = useState('1')
  const [muteMinutes, setMuteMinutes] = useState('10')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleBan() {
    setError('')
    startTransition(async () => {
      const result = await banPlayerAction(userId, Number(banDays), 'Issued from admin panel')
      if (result.error) { setError(result.error); return }
      router.refresh()
    })
  }

  function handleMute() {
    setError('')
    startTransition(async () => {
      const result = await mutePlayerAction(userId, Number(muteMinutes), 'Issued from admin panel')
      if (result.error) { setError(result.error); return }
      router.refresh()
    })
  }

  return (
    <div className={styles.playerRow}>
      <span>{nationName}</span>
      <div className={styles.actions}>
        {error ? <span className={styles.error}>{error}</span> : null}
        {canMute ? (
          <div className={styles.formInline}>
            <input className={styles.smallInput} type="number" min={1} value={muteMinutes} onChange={(e) => setMuteMinutes(e.target.value)} />
            <button type="button" className={`btn btn--outline ${styles.smallBtn}`} onClick={handleMute} disabled={isPending}>
              Mute (min)
            </button>
          </div>
        ) : null}
        {canBan ? (
          <div className={styles.formInline}>
            <input className={styles.smallInput} type="number" min={1} max={maxBanDays} value={banDays} onChange={(e) => setBanDays(e.target.value)} />
            <button type="button" className={`btn btn--primary ${styles.smallBtn}`} onClick={handleBan} disabled={isPending}>
              Ban (days)
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}