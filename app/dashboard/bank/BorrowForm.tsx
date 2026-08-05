'use client'

import { useState, useTransition } from 'react'
import { applyForLoanAction } from './actions'
import { formatCash } from '@/lib/format'
import styles from './bank.module.css'

export default function BorrowForm({
  nationId,
  maxBorrowCap,
  totalActiveDebt,
  isBlocked,
}: {
  nationId: string
  maxBorrowCap: number
  totalActiveDebt: number
  isBlocked: boolean
}) {
  const [amount, setAmount] = useState('')
  const [duration, setDuration] = useState('14')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const remainingRoom = Math.max(0, maxBorrowCap - totalActiveDebt)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('Enter a valid loan amount.')
      return
    }
    if (amt > remainingRoom) {
      setError(`You can borrow up to ${formatCash(remainingRoom)} more.`)
      return
    }

    startTransition(async () => {
      const result = await applyForLoanAction(nationId, amt, Number(duration))
      if (result.error) {
        setError(result.error)
        return
      }
      window.location.reload()
    })
  }

  if (isBlocked) {
    return (
      <div className={`${styles.panel} card`}>
        <div className={styles.error} style={{ marginBottom: 0 }}>
          Your credit grade is F — borrowing is blocked until your score improves
          (pay down existing debt or raise your Approval Rating).
        </div>
      </div>
    )
  }

  return (
    <form className={`${styles.panel} card`} onSubmit={handleSubmit}>
      <div className={styles.formRow}>
        <div className={styles.formField}>
          <label className="field__label" htmlFor="loan-amount">
            Amount ($)
          </label>
          <input
            id="loan-amount"
            className="input"
            type="number"
            min={1}
            max={remainingRoom}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Up to ${formatCash(remainingRoom)}`}
          />
        </div>
        <div className={styles.formField}>
          <label className="field__label" htmlFor="loan-duration">
            Duration
          </label>
          <select
            id="loan-duration"
            className="select"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option value="7">7 ticks</option>
            <option value="14">14 ticks</option>
            <option value="28">28 ticks</option>
          </select>
        </div>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <button type="submit" className="btn btn--primary btn--full" disabled={isPending || remainingRoom <= 0}>
        {isPending ? 'Submitting…' : remainingRoom <= 0 ? 'Borrowing cap reached' : 'Apply for Loan'}
      </button>
    </form>
  )
}