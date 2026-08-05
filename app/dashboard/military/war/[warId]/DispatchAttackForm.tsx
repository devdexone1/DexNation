'use client'

import { useState, useTransition } from 'react'
import { dispatchAttackAction } from '@/app/dashboard/military/actions'
import { formatNumber } from '@/lib/format'
import styles from './war-room.module.css'

interface DeployableUnit {
  unit_type: string
  name: string
  amount: number
}

export default function DispatchAttackForm({
  warId,
  attackerNationId,
  deployableUnits,
}: {
  warId: string
  attackerNationId: string
  deployableUnits: DeployableUnit[]
}) {
  const [unitType, setUnitType] = useState(deployableUnits[0]?.unit_type ?? '')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  const selected = deployableUnits.find((u) => u.unit_type === unitType)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const qty = Number(amount)
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Enter a valid amount to send.')
      return
    }
    if (selected && qty > selected.amount) {
      setError(`You only have ${formatNumber(selected.amount)} available.`)
      return
    }

    startTransition(async () => {
      const result = await dispatchAttackAction(warId, attackerNationId, unitType, qty)
      if (result.error) {
        setError(result.error)
        return
      }
      setSuccess('Troops dispatched. Check "En Route" below for arrival time.')
      setAmount('')
      setTimeout(() => window.location.reload(), 1000)
    })
  }

  if (deployableUnits.length === 0) {
    return (
      <div className={`${styles.panel} card`}>
        <div className={styles.emptyState}>
          You have no deployable Land units. Recruit Infantry, Armored Division, or Heavy
          Artillery first.
        </div>
      </div>
    )
  }

  return (
    <form className={`${styles.panel} card`} onSubmit={handleSubmit}>
      <div className={styles.formRow}>
        <div>
          <label className="field__label" htmlFor="unit-type">
            Unit
          </label>
          <select
            id="unit-type"
            className="select"
            value={unitType}
            onChange={(e) => setUnitType(e.target.value)}
          >
            {deployableUnits.map((u) => (
              <option key={u.unit_type} value={u.unit_type}>
                {u.name} ({formatNumber(u.amount)} available)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field__label" htmlFor="amount">
            Amount to Send
          </label>
          <input
            id="amount"
            className="input"
            type="number"
            min={1}
            max={selected?.amount}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 50"
          />
        </div>
      </div>

      <p className={styles.hint}>
        Travel time: 5 minutes (same continent) or 15 minutes (cross-continent, costs
        Fuel). Battle resolves automatically 60 seconds after arrival.
      </p>

      {error ? <div className={styles.error}>{error}</div> : null}
      {success ? <div className={styles.hint} style={{ color: '#0a7a5c' }}>{success}</div> : null}

      <button type="submit" className="btn btn--primary btn--full" disabled={isPending} style={{ marginTop: 10 }}>
        {isPending ? 'Dispatching…' : 'Dispatch Attack'}
      </button>
    </form>
  )
}