'use client'

import { useEffect, useState } from 'react'
import styles from './NewsTicker.module.css'

function msUntilNextTick() {
  const now = new Date()
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0))
  return next.getTime() - now.getTime()
}

function formatHm(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  return `${h}:${m}`
}

export default function NewsTicker({
  items,
  currentDay,
}: {
  items: { id: string; message: string }[]
  currentDay: number
}) {
  const [utcTime, setUtcTime] = useState('--:--')
  const [nextTickIn, setNextTickIn] = useState('--:--')

  useEffect(() => {
    function update() {
      const now = new Date()
      setUtcTime(`${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`)
      setNextTickIn(formatHm(msUntilNextTick()))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  const looped = items.length > 0 ? [...items, ...items] : []

  return (
    <div className={styles.bar}>
      <span className={styles.newsLabel}>News</span>
      <div className={styles.tickerWrap}>
        {looped.length === 0 ? (
          <span className={styles.item}>No news right now.</span>
        ) : (
          <div className={styles.track}>
            {looped.map((n, i) => (
              <span className={styles.item} key={`${n.id}-${i}`}>{n.message}</span>
            ))}
          </div>
        )}
      </div>
      <div className={styles.meta}>
        <span className={styles.dayLabel}>Day {Number.isFinite(currentDay) ? currentDay : '—'}, {utcTime} UTC</span>
        {/* Informational only — deliberately NOT a clickable trigger. Letting
            players manually fire the Daily Tick would be a severe exploit
            (repeated production/farming). This just shows the countdown. */}
        <span className={styles.nextTickPill}>Next Tick in {nextTickIn}</span>
      </div>
    </div>
  )
}