'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
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
      try {
        const supabase = createClient()
        const { error: rpcError } = await supabase.rpc('cancel_sell_order', {
          p_nation_id: nationId,
          p_order_id: order.id,
        })
        if (rpcError) {
          setError(rpcError.message)
          return
        }
        window.location.reload()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      }
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
      try {
        const supabase = createClient()
        const { error: rpcError } = await supabase.rpc('buy_market_order', {
          p_buyer_nation_id: nationId,
          p_order_id: order.id,
          p_quantity: quantity,
        })
        if (rpcError) {
          setError(rpcError.message)
          return
        }
        window.location.reload()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      }
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