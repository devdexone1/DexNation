'use client'

import { useState, useTransition } from 'react'
import { buildBuildingAction } from './actions'
import { formatCash, formatNumber } from '@/lib/format'
import type { BuildingType } from '@/types/database'
import styles from './economy.module.css'

export default function BuildingCatalog({
  nationId,
  buildingTypes,
  cashBalance,
  steelAmount,
}: {
  nationId: string
  buildingTypes: BuildingType[]
  cashBalance: number
  steelAmount: number
}) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [, startTransition] = useTransition()

  function handleBuild(buildingTypeId: string) {
    setErrors((prev) => ({ ...prev, [buildingTypeId]: '' }))
    setPendingId(buildingTypeId)

    startTransition(async () => {
      const result = await buildBuildingAction(nationId, buildingTypeId)
      if (result.error) {
        setErrors((prev) => ({ ...prev, [buildingTypeId]: result.error! }))
        setPendingId(null)
        return
      }
      window.location.reload()
    })
  }

  return (
    <div className={styles.catalogGrid}>
      {buildingTypes.map((bt) => {
        const isHighTech = bt.tier !== 'Normal'
        const canAffordCash = cashBalance >= bt.cost_cash
        const canAffordSteel = steelAmount >= bt.cost_steel
        const canBuild = !isHighTech && canAffordCash && canAffordSteel
        const isPending = pendingId === bt.id

        return (
          <div
            key={bt.id}
            className={`${styles.catalogCard} card ${isHighTech ? styles.catalogCardLocked : ''}`}
          >
            <div className={styles.catalogName}>{bt.name}</div>
            <div className={styles.catalogMeta}>
              Build time: {bt.build_time_ticks} tick{bt.build_time_ticks === 1 ? '' : 's'}
              {isHighTech ? ' · Requires research (not unlocked yet)' : ''}
            </div>

            <div className={styles.catalogCost}>
              <div className={styles.catalogCostItem}>
                <span className={styles.catalogCostLabel}>Cash</span>
                <span className="mono">{formatCash(bt.cost_cash)}</span>
              </div>
              {bt.cost_steel > 0 && (
                <div className={styles.catalogCostItem}>
                  <span className={styles.catalogCostLabel}>Steel</span>
                  <span className="mono">{formatNumber(bt.cost_steel)}</span>
                </div>
              )}
            </div>

            {errors[bt.id] ? <div className={styles.catalogError}>{errors[bt.id]}</div> : null}

            <button
              type="button"
              className="btn btn--primary btn--full"
              disabled={!canBuild || isPending}
              onClick={() => handleBuild(bt.id)}
            >
              {isHighTech
                ? 'Locked'
                : isPending
                  ? 'Building…'
                  : !canAffordCash
                    ? 'Not enough cash'
                    : !canAffordSteel
                      ? 'Not enough steel'
                      : 'Build'}
            </button>
          </div>
        )
      })}
    </div>
  )
}