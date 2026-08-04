'use client'

import { useEffect, useState } from 'react'
import { formatNumber } from '@/lib/format'
import type { TroopMovement } from '@/types/database'
import styles from './war-room.module.css'

function formatCountdown(arrivalAt: string) {
  const diffMs = new Date(arrivalAt).getTime() - Date.now()
  if (diffMs <= 0) return 'Resolving…'
  const totalSeconds = Math.floor(diffMs / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

export default function TroopMovementsList({
  movements,
  unitNameById,
}: {
  movements: TroopMovement[]
  unitNameById: Record<string, string>
}) {
  const [, forceTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Auto-refresh the page every 15s so newly resolved battles show up
  // without the player having to manually reload.
  useEffect(() => {
    const id = setInterval(() => window.location.reload(), 15000)
    return () => clearInterval(id)
  }, [])

  if (movements.length === 0) {
    return <div className={styles.emptyState}>No troop movements right now.</div>
  }

  return (
    <div className={`${styles.panel} card`}>
      {movements.map((m) => (
        <div className={styles.movementRow} key={m.id}>
          <div className={styles.movementInfo}>
            <span>
              {formatNumber(m.amount_sent)} {unitNameById[m.unit_type] ?? m.unit_type}
            </span>
            <span className={styles.movementMeta}>
              {m.direction === 'OUTBOUND' ? 'Advancing' : 'Returning home'} · {m.route_type}
            </span>
          </div>
          <span className={styles.countdown}>{formatCountdown(m.arrival_at)}</span>
        </div>
      ))}
    </div>
  )
}