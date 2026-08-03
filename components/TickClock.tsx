'use client'

import { useEffect, useState } from 'react'
import styles from './Sidebar.module.css'

function getMsUntilNextTick() {
  const now = new Date()
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
  )
  return next.getTime() - now.getTime()
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function TickClock() {
  const [msLeft, setMsLeft] = useState<number | null>(null)

  useEffect(() => {
    setMsLeft(getMsUntilNextTick())
    const id = setInterval(() => setMsLeft(getMsUntilNextTick()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={styles.tickClock}>
      <span className={styles.tickDot} />
      <div className={styles.tickText}>
        <span className={styles.tickLabel}>Next Daily Tick</span>
        <span className={`${styles.tickValue} mono`}>
          {msLeft === null ? '--:--:--' : formatDuration(msLeft)}
        </span>
      </div>
    </div>
  )
}
