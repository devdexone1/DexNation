'use client'

import { useState, useTransition } from 'react'
import { formatNumber } from '@/lib/format'
import { BUILDING_CATEGORY_LABELS } from '@/types/database'
import type { BuildingType, NationBuilding } from '@/types/database'
import { upgradeBuildingAction } from './actions'
import ConfirmButton from '@/components/ConfirmButton'
import BuildingDetailModal from './BuildingDetailModal'
import styles from './economy.module.css'

export default function OwnedBuildingsList({
  nationId,
  buildings,
  catalog,
}: {
  nationId: string
  buildings: NationBuilding[]
  catalog: BuildingType[]
}) {
  const [selected, setSelected] = useState<{ buildingType: BuildingType; instances: NationBuilding[] } | null>(null)
  const [upgradeError, setUpgradeError] = useState<Record<string, string>>({})
  const [, startTransition] = useTransition()

  const grouped = Object.values(
    buildings.reduce<Record<string, { buildingType: BuildingType; instances: NationBuilding[] }>>((acc, b) => {
      const bt = catalog.find((c) => c.id === b.building_type_id)
      if (!bt) return acc
      if (!acc[b.building_type_id]) acc[b.building_type_id] = { buildingType: bt, instances: [] }
      acc[b.building_type_id].instances.push(b)
      return acc
    }, {})
  )

  function handleUpgrade(buildingId: string) {
    setUpgradeError((prev) => ({ ...prev, [buildingId]: '' }))
    startTransition(async () => {
      const result = await upgradeBuildingAction(nationId, buildingId)
      if (result.error) {
        setUpgradeError((prev) => ({ ...prev, [buildingId]: result.error! }))
        return
      }
      window.location.reload()
    })
  }

  if (grouped.length === 0) {
    return <div className={styles.emptyState}>You don&apos;t own any buildings yet — construct your first one below.</div>
  }

  return (
    <div>
      {grouped.map((g) => (
        <div key={g.buildingType.id}>
          {g.instances.map((instance) => (
            <div className={styles.ownedListRow} key={instance.id}>
              <div>
                <button type="button" className={styles.ownedNameBtn} onClick={() => setSelected(g)}>
                  {g.buildingType.name}
                </button>
                <div className={styles.ownedCategorySmall}>
                  {BUILDING_CATEGORY_LABELS[g.buildingType.category] ?? g.buildingType.category} · Level {instance.level}
                </div>
                {upgradeError[instance.id] ? (
                  <div style={{ fontSize: 11, color: 'var(--color-negative)' }}>{upgradeError[instance.id]}</div>
                ) : null}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge--accent">Lv. {instance.level}/5</span>
                {instance.level < 5 ? (
                  <ConfirmButton
                    label="Upgrade"
                    confirmLabel="Confirm Upgrade"
                    onConfirm={() => handleUpgrade(instance.id)}
                    className="btn btn--outline"
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ))}

      {selected ? (
        <BuildingDetailModal
          buildingType={selected.buildingType}
          ownedCount={selected.instances.length}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  )
}