'use client'

import { useEffect, useState } from 'react'
import { formatNumber } from '@/lib/format'
import styles from './war-room.module.css'

interface ReplayStep {
  t: number
  attacker: number
  defender: number
}

export default function BattleReplay({
  replayLog,
  attackerStart,
  defenderStart,
}: {
  replayLog: ReplayStep[]
  attackerStart: number
  defenderStart: number
}) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
    const id = setInterval(() => {
      setIndex((prev) => (prev < replayLog.length - 1 ? prev + 1 : prev))
    }, 1000)
    return () => clearInterval(id)
  }, [replayLog])

  const step = replayLog[index] ?? replayLog[0]
  const attackerPct = attackerStart > 0 ? (step.attacker / attackerStart) * 100 : 0
  const defenderPct = defenderStart > 0 ? (step.defender / defenderStart) * 100 : 0

  return (
    <div className={styles.replayWrap}>
      <div className={styles.replayBars}>
        <div className={styles.replayRow}>
          <span className={styles.replayLabel}>Attacker</span>
          <div className={styles.replayBarTrack}>
            <div className={styles.replayBarFillAttacker} style={{ width: `${attackerPct}%` }} />
          </div>
          <span className={styles.replayCount}>{formatNumber(step.attacker)}</span>
        </div>
        <div className={styles.replayRow}>
          <span className={styles.replayLabel}>Defender</span>
          <div className={styles.replayBarTrack}>
            <div className={styles.replayBarFillDefender} style={{ width: `${defenderPct}%` }} />
          </div>
          <span className={styles.replayCount}>{formatNumber(step.defender)}</span>
        </div>
      </div>
      <div className={styles.replayClock}>t = {step.t}s / 60s</div>
    </div>
  )
}