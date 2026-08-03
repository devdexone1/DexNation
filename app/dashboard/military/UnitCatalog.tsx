'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCash, formatNumber } from '@/lib/format'
import type { MilitaryUnitType } from '@/types/database'
import styles from './military.module.css'

export default function UnitCatalog({
  nationId,
  units,
  cashBalance,
  population,
  stockByType,
  completedTechIds,
}: {
  nationId: string
  units: MilitaryUnitType[]
  cashBalance: number
  population: number
  stockByType: Record<string, number>
  completedTechIds: Set<string>
}) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [, startTransition] = useTransition()

  function handleRecruit(unitId: string) {
    setErrors((prev) => ({ ...prev, [unitId]: '' }))
    setPendingId(unitId)

    startTransition(async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase.rpc('recruit_unit', {
          p_nation_id: nationId,
          p_unit_type_id: unitId,
        })

        if (error) {
          setErrors((prev) => ({ ...prev, [unitId]: error.message }))
          setPendingId(null)
          return
        }

        window.location.reload()
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          [unitId]: err instanceof Error ? err.message : 'Something went wrong.',
        }))
        setPendingId(null)
      }
    })
  }

  return (
    <div className={styles.catalogGrid}>
      {units.map((unit) => {
        const isLockedByTech = unit.required_tech_id
          ? !completedTechIds.has(unit.required_tech_id)
          : false

        const canAffordCash = cashBalance >= unit.cost_cash
        const canAffordPopulation = population >= unit.cost_population
        const resourceEntries = Object.entries(unit.cost_resources ?? {})
        const canAffordResources = resourceEntries.every(
          ([res, amt]) => (stockByType[res] ?? 0) >= amt
        )

        const canRecruit =
          !isLockedByTech && canAffordCash && canAffordPopulation && canAffordResources
        const isPending = pendingId === unit.id

        let buttonLabel = 'Recruit'
        if (isLockedByTech) buttonLabel = `Requires ${unit.required_tech_id}`
        else if (!canAffordCash) buttonLabel = 'Not enough cash'
        else if (!canAffordPopulation) buttonLabel = 'Not enough population'
        else if (!canAffordResources) buttonLabel = 'Not enough resources'
        else if (isPending) buttonLabel = 'Recruiting…'

        return (
          <div
            key={unit.id}
            className={`${styles.catalogCard} card ${isLockedByTech ? styles.catalogCardLocked : ''}`}
          >
            <div className={styles.catalogName}>{unit.name}</div>
            <div className={styles.catalogMeta}>
              Attack {unit.attack} · Defense {unit.defense}
              {unit.special_stat ? ` · ${unit.special_stat}` : ''}
            </div>

            <div className={styles.catalogCostList}>
              <div className={styles.catalogCostItem}>
                <span className={styles.catalogCostLabel}>Cash</span>
                <span className="mono">{formatCash(unit.cost_cash)}</span>
              </div>
              {unit.cost_population > 0 && (
                <div className={styles.catalogCostItem}>
                  <span className={styles.catalogCostLabel}>Population</span>
                  <span className="mono">{formatNumber(unit.cost_population)}</span>
                </div>
              )}
              {resourceEntries.map(([res, amt]) => (
                <div className={styles.catalogCostItem} key={res}>
                  <span className={styles.catalogCostLabel}>{res}</span>
                  <span className="mono">{formatNumber(amt)}</span>
                </div>
              ))}
            </div>

            {errors[unit.id] ? <div className={styles.catalogError}>{errors[unit.id]}</div> : null}

            <button
              type="button"
              className="btn btn--primary btn--full"
              disabled={!canRecruit || isPending}
              onClick={() => handleRecruit(unit.id)}
            >
              {buttonLabel}
            </button>
          </div>
        )
      })}
    </div>
  )
}