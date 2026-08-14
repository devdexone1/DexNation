'use client'

import { useEffect } from 'react'
import { formatCash, formatNumber } from '@/lib/format'
import { BUILDING_CATEGORY_LABELS } from '@/types/database'
import type { BuildingType } from '@/types/database'
import styles from './economy.module.css'

export default function BuildingDetailModal({
  buildingType,
  ownedCount,
  onClose,
}: {
  buildingType: BuildingType
  ownedCount: number
  onClose: () => void
}) {
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const inputs = Object.entries(buildingType.input_resources ?? {})
  const outputs = Object.entries(buildingType.output_resources ?? {})

  return (
    <div className={styles.detailModal} onClick={onClose} role="presentation">
      <div className={styles.detailCard} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.detailClose} onClick={onClose} aria-label="Close">✕</button>
        <div className={styles.detailTitle}>{buildingType.name}</div>
        <div className={styles.detailMeta}>
          {BUILDING_CATEGORY_LABELS[buildingType.category] ?? buildingType.category} · You own {formatNumber(ownedCount)}
        </div>

        <div className={styles.detailRow}>
          <span>Build Cost</span>
          <span className="mono">{formatCash(buildingType.cost_cash)} + {buildingType.cost_steel} Steel</span>
        </div>
        <div className={styles.detailRow}>
          <span>Build Time</span>
          <span className="mono">{buildingType.build_time_ticks} day{buildingType.build_time_ticks === 1 ? '' : 's'}</span>
        </div>
        {buildingType.electricity_mw_delta !== 0 ? (
          <div className={styles.detailRow}>
            <span>Electricity</span>
            <span className="mono">{buildingType.electricity_mw_delta > 0 ? '+' : ''}{buildingType.electricity_mw_delta} MW</span>
          </div>
        ) : null}
        {inputs.map(([key, val]) => (
          <div className={styles.detailRow} key={key}>
            <span>Consumes / day</span>
            <span className="mono">{val} {key}</span>
          </div>
        ))}
        {outputs.map(([key, val]) => (
          <div className={styles.detailRow} key={key}>
            <span>Produces / day</span>
            <span className="mono">{val} {key}</span>
          </div>
        ))}
      </div>
    </div>
  )
}