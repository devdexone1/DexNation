'use client'

import { useState, useTransition } from 'react'
import { allianceBailoutAction } from './actions'
import { formatCash } from '@/lib/format'
import type { AllianceMemberDebt } from '@/types/database'
import styles from './politics.module.css'

export default function AllianceBailout({
  leaderNationId,
  treasuryCash,
  membersInDebt,
}: {
  leaderNationId: string
  treasuryCash: number
  membersInDebt: AllianceMemberDebt[]
}) {
  const [error, setError] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleBailout(targetNationId: string) {
    setError('')
    setPendingId(targetNationId)
    startTransition(async () => {
      const result = await allianceBailoutAction(leaderNationId, targetNationId)
      if (result.error) {
        setError(result.error)
        setPendingId(null)
        return
      }
      window.location.reload()
    })
  }

  if (membersInDebt.length === 0) {
    return (
      <div className={styles.notifMeta} style={{ marginBottom: 16 }}>
        No alliance members currently have outstanding World Bank debt.
      </div>
    )
  }

  return (
    <div className={`${styles.allianceCard} card`} style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 14, marginBottom: 4 }}>Alliance Bailout</h3>
      <p className={styles.notifMeta} style={{ marginBottom: 10 }}>
        Treasury: {formatCash(treasuryCash)} — clears a member&apos;s debt using alliance
        funds and restores their credit grade to at least C.
      </p>

      {error ? <div className={styles.error}>{error}</div> : null}

      {membersInDebt.map((m) => (
        <div className={styles.bailoutRow} key={m.nation_id}>
          <span>
            {m.nation_name} <span className="mono">({formatCash(m.total_debt)})</span>
          </span>
          <button
            type="button"
            className="btn btn--primary"
            style={{ padding: '8px 14px', fontSize: 12.5 }}
            onClick={() => handleBailout(m.nation_id)}
            disabled={pendingId === m.nation_id || treasuryCash < m.total_debt}
          >
            {pendingId === m.nation_id
              ? 'Processing…'
              : treasuryCash < m.total_debt
                ? 'Insufficient Treasury'
                : 'Bailout'}
          </button>
        </div>
      ))}
    </div>
  )
}