'use client'

import { useState } from 'react'
import { formatNumber } from '@/lib/format'
import type { BattleLog } from '@/types/database'
import BattleReplay from './BattleReplay'
import styles from './war-room.module.css'

export default function BattleLogItem({
  battle,
  attackerName,
  defenderName,
}: {
  battle: BattleLog
  attackerName: string
  defenderName: string
}) {
  const [showReplay, setShowReplay] = useState(false)

  return (
    <div className={`${styles.battleCard} card`}>
      <div className={styles.battleHeader}>
        <span className={styles.battleParties}>
          {attackerName} <span style={{ color: 'var(--color-ink-faint)' }}>attacked</span> {defenderName}
        </span>
        <span className={`badge ${battle.winner === 'ATTACKER' ? 'badge--positive' : 'badge--neutral'}`}>
          {battle.winner} won
        </span>
      </div>
      <div className={styles.battleStats}>
        <span>Attacker: {formatNumber(battle.attacker_start)} → {formatNumber(battle.attacker_end)}</span>
        <span>Defender: {formatNumber(battle.defender_start)} → {formatNumber(battle.defender_end)}</span>
        <span>{new Date(battle.created_at).toLocaleString()}</span>
      </div>

      <button
        type="button"
        className="btn btn--outline"
        style={{ padding: '8px 14px', fontSize: 12.5 }}
        onClick={() => setShowReplay((v) => !v)}
      >
        {showReplay ? 'Hide Replay' : 'Watch Replay (60s)'}
      </button>

      {showReplay ? (
        <BattleReplay
          replayLog={battle.replay_log}
          attackerStart={battle.attacker_start}
          defenderStart={battle.defender_start}
        />
      ) : null}
    </div>
  )
}