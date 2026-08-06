'use client'

import { useState, useTransition } from 'react'
import { formatNumber } from '@/lib/format'
import { dispatchNavalAction, recallNavalBlockadeAction } from '../../actions'
import styles from './war-room.module.css'

interface DeployableNavalUnit {
  unit_type: string
  name: string
  amount: number
}

export default function NavalBlockadePanel({
  warId,
  nationId,
  holder,
  deployableUnits,
}: {
  warId: string
  nationId: string
  holder: { nation_id: string; nation_name: string; unit_name: string; amount: number } | null
  deployableUnits: DeployableNavalUnit[]
}) {
  const [unitType, setUnitType] = useState(deployableUnits[0]?.unit_type ?? '')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const isMyBlockade = holder?.nation_id === nationId

  function handleDispatch(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const qty = Number(amount)
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Enter a valid amount.')
      return
    }
    startTransition(async () => {
      const result = await dispatchNavalAction(warId, nationId, unitType, qty)
      if (result.error) {
        setError(result.error)
        return
      }
      window.location.reload()
    })
  }

  function handleRecall() {
    setError('')
    startTransition(async () => {
      const result = await recallNavalBlockadeAction(nationId, warId)
      if (result.error) {
        setError(result.error)
        return
      }
      window.location.reload()
    })
  }

  return (
    <div className={`${styles.panel} card`}>
      {holder ? (
        <div style={{ marginBottom: 14 }}>
          <strong>{holder.nation_name}</strong> holds the naval blockade with{' '}
          {formatNumber(holder.amount)} {holder.unit_name}.
          {isMyBlockade ? (
            <div style={{ marginTop: 10 }}>
              <button type="button" className="btn btn--outline" onClick={handleRecall} disabled={isPending}>
                {isPending ? 'Recalling…' : 'Recall Blockade'}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className={styles.hint} style={{ marginBottom: 14 }}>
          No one currently holds the naval blockade — send ships to claim it uncontested.
        </div>
      )}

      {error ? <div className={styles.error}>{error}</div> : null}

      {deployableUnits.length > 0 && !isMyBlockade ? (
        <form onSubmit={handleDispatch} className={styles.formRow}>
          <select className="select" value={unitType} onChange={(e) => setUnitType(e.target.value)}>
            {deployableUnits.map((u) => (
              <option key={u.unit_type} value={u.unit_type}>
                {u.name} ({formatNumber(u.amount)} available)
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              type="number"
              min={1}
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button type="submit" className="btn btn--primary" disabled={isPending} style={{ whiteSpace: 'nowrap' }}>
              {isPending ? 'Sending…' : 'Dispatch'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}