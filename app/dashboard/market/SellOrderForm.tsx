'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createSellOrderAction } from './actions'
import { formatNumber } from '@/lib/format'
import styles from './market.module.css'

export default function SellOrderForm({
  nationId,
  stockByType,
}: {
  nationId: string
  stockByType: Record<string, number>
}) {
  const router = useRouter()
  const availableResources = Object.entries(stockByType).filter(([, amt]) => amt > 0)
  const [resourceType, setResourceType] = useState(availableResources[0]?.[0] ?? '')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const maxAvailable = stockByType[resourceType] ?? 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const qty = Number(quantity)
    const unitPrice = Number(price)

    if (!resourceType) {
      setError('Select a resource to sell.')
      return
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Enter a valid quantity.')
      return
    }
    if (qty > maxAvailable) {
      setError(`You only have ${formatNumber(maxAvailable)} ${resourceType}.`)
      return
    }
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      setError('Enter a valid price per unit.')
      return
    }

    startTransition(async () => {
      const result = await createSellOrderAction(nationId, resourceType, unitPrice, qty)
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  if (availableResources.length === 0) {
    return (
      <div className={`${styles.panel} card`}>
        <div className={styles.emptyState}>
          You don&apos;t have any resources in stock to sell yet.
        </div>
      </div>
    )
  }

  return (
    <form className={`${styles.panel} card`} onSubmit={handleSubmit}>
      <div className={styles.formField}>
        <label className="field__label" htmlFor="resource-type">
          Resource
        </label>
        <select
          id="resource-type"
          className="select"
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
        >
          {availableResources.map(([res, amt]) => (
            <option key={res} value={res}>
              {res} ({formatNumber(amt)} available)
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formField}>
          <label className="field__label" htmlFor="qty">
            Quantity
          </label>
          <input
            id="qty"
            className="input"
            type="number"
            min={1}
            max={maxAvailable}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 100"
          />
          <span className={styles.stockHint}>Max: {formatNumber(maxAvailable)}</span>
        </div>
        <div className={styles.formField}>
          <label className="field__label" htmlFor="price">
            Price per unit ($)
          </label>
          <input
            id="price"
            className="input"
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 25"
          />
        </div>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <button type="submit" className="btn btn--primary btn--full" disabled={isPending}>
        {isPending ? 'Listing…' : 'List for Sale'}
      </button>
    </form>
  )
}