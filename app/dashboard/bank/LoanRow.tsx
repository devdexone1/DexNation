'use client'

import { useState, useTransition } from 'react'
import { makeLoanPaymentAction } from './actions'
import { formatCash, formatPercent } from '@/lib/format'
import type { WorldBankLoan } from '@/types/database'
import styles from './bank.module.css'

export default function LoanRow({ loan, nationId }: { loan: WorldBankLoan; nationId: string }) {
  const [amount, setAmount] = useState(String(loan.remaining_principal))
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handlePay() {
    setError('')
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('Enter a valid amount.')
      return
    }
    startTransition(async () => {
      const result = await makeLoanPaymentAction(nationId, loan.id, amt)
      if (result.error) {
        setError(result.error)
        return
      }
      window.location.reload()
    })
  }

  return (
    <div className={styles.loanRow}>
      <div className={styles.loanInfo}>
        <span className={styles.loanPrincipal}>
          {formatCash(loan.remaining_principal)} remaining
        </span>
        <span className={styles.loanMeta}>
          Original: {formatCash(loan.initial_principal)} · {formatPercent(loan.daily_interest_rate * 100)} / day ·{' '}
          {loan.duration_ticks}-day term
        </span>
        {error ? <span className={styles.error} style={{ marginBottom: 0 }}>{error}</span> : null}
      </div>

      <div className={styles.loanActions}>
        <span className={`badge ${loan.status === 'ACTIVE' ? 'badge--positive' : 'badge--neutral'}`}>
          {loan.status}
        </span>
        {loan.status !== 'CLEARED' && (
          <>
            <input
              className={styles.payInput}
              type="number"
              min={1}
              max={loan.remaining_principal}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button
              type="button"
              className={`btn btn--primary ${styles.smallBtn}`}
              onClick={handlePay}
              disabled={isPending}
            >
              {isPending ? 'Paying…' : 'Pay'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}