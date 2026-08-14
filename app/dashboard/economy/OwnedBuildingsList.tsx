'use client'

import { useState } from 'react'
import { formatNumber } from '@/lib/format'
import { BUILDING_CATEGORY_LABELS } from '@/types/database'
import type { BuildingType } from '@/types/database'
import BuildingDetailModal from './BuildingDetailModal'
import styles from './economy.module.css'

interface GroupedBuilding {
  buildingType: BuildingType
  count: number
}

export default function OwnedBuildingsList({ grouped }: { grouped: GroupedBuilding[] }) {
  const [selected, setSelected] = useState<GroupedBuilding | null>(null)

  if (grouped.length === 0) {
    return (
      <div className={styles.emptyState}>You don&apos;t own any buildings yet — construct your first one below.</div>
    )
  }

  return (
    <div>
      {grouped.map((g) => (
        <div className={styles.ownedListRow} key={g.buildingType.id}>
          <div>
            <button type="button" className={styles.ownedNameBtn} onClick={() => setSelected(g)}>
              {g.buildingType.name}
            </button>
            <div className={styles.ownedCategorySmall}>
              {BUILDING_CATEGORY_LABELS[g.buildingType.category] ?? g.buildingType.category}
            </div>
          </div>
          <span className="badge badge--accent">× {formatNumber(g.count)}</span>
        </div>
      ))}

      {selected ? (
        <BuildingDetailModal
          buildingType={selected.buildingType}
          ownedCount={selected.count}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  )
}