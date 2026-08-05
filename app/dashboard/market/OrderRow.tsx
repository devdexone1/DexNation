'use client'

import { useState, useTransition } from 'react'
import { buyMarketOrderAction, cancelSellOrderAction } from './actions'
import { formatCash, formatNumber } from '@/lib/format'
import type { P2PMarketOrder } from '@/types/database'
import styles from './market.module.css'

export default function OrderRow({
  order,
  nationId,
  mode,
  sellerName,
}: {
  order: P2PMarketOrder
  nationId: string
  mode: 'own' | 'buy'
  sellerName?: string
}) {
  const [qty, setQty] = useState(String(order.remaining_quantity))
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleCancel() {
    setError('')
    startTransition(async () => {
      const result = await cancelSellOrderAction(nationId, order.id)
      if (result.error) {
        setError(result.error)
        return
      }
      window.location.reload()
    })
  }

  function handleBuy() {
    setError('')
    const quantity = Number(qty)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Enter a valid quantity.')
      return
    }
    startTransition(async () => {
      const result = await buyMarketOrderAction(nationId, order.id, quantity)
      if (result.error) {
        setError(result.error)
        return
      }
      window.location.reload()
    })
  }

  const total = order.unit_price_cash * Number(qty || 0)

  return (
    <div className={styles.orderRow}>
      <div className={styles.orderInfo}>
        <span className={styles.orderResource}>
          {order.resource_type} · {formatNumber(order.remaining_quantity)} left
        </span>
        <span className={styles.orderMeta}>
          {formatCash(order.unit_price_cash)} / unit
          {mode === 'buy' && sellerName ? ` · sold by ${sellerName}` : ''}
        </span>
        {error ? <span className={styles.error}>{error}</span> : null}
      </div>

      <div className={styles.orderActions}>
        {mode === 'own' ? (
          <button
            type="button"
            className={`btn btn--outline ${styles.smallBtn}`}
            onClick={handleCancel}
            disabled={isPending}
          >
            {isPending ? 'Cancelling…' : 'Cancel'}
          </button>
        ) : (
          <>
            <input
              className={styles.qtyInput}
              type="number"
              min={1}
              max={order.remaining_quantity}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            <button
              type="button"
              className={`btn btn--primary ${styles.smallBtn}`}
              onClick={handleBuy}
              disabled={isPending}
            >
              {isPending ? 'Buying…' : `Buy (${formatCash(total)})`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}