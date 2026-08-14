'use client'

import { useState, useTransition } from 'react'
import { formatCash } from '@/lib/format'
import { payUpkeepDebtAction } from './actions'
import ConfirmButton from '@/components/ConfirmButton'
import type { MilitaryUpkeepDebt } from '@/types/database'
import styles from './military.module.css'

export default function UpkeepDebtsPanel({
  nationId,
  debts,
}: {
  nationId: string
  debts: MilitaryUpkeepDebt[]
}) {
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handlePay(debtId: string) {
    setError('')
    startTransition(async () => {
      const result = await payUpkeepDebtAction(nationId, debtId)
      if (result.error) {
        setError(result.error)
        return
      }
      window.location.reload()
    })
  }

  if (debts.length === 0) {
    return <div className={styles.emptyState}>No unpaid upkeep penalties.</div>
  }

  return (
    <div className={`${styles.warsPanel} card`}>
      {error ? <div style={{ fontSize: 12, color: 'var(--color-negative)', marginBottom: 8 }}>{error}</div> : null}
      {debts.map((d) => (
        <div className={styles.debtRow} key={d.id}>
          <div>
            <div>{formatCash(d.penalty_fee_cash)} penalty</div>
            <div className={styles.debtMeta}>
              From unpaid: {formatCash(d.unpaid_cash)} cash, {d.unpaid_food} Food, {d.unpaid_fuel} Fuel
            </div>
          </div>
          <ConfirmButton
            label="Pay Now"
            confirmLabel="Confirm Payment"
            onConfirm={() => handlePay(d.id)}
            className="btn btn--primary"
            disabled={isPending}
          />
        </div>
      ))}
    </div>
  )
}