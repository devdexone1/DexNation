import { BUILDING_CATEGORY_LABELS } from '@/types/database'
import type { BuildingType, NationBuilding } from '@/types/database'
import ResourceIcon from './ResourceIcon'
import styles from './overview.module.css'

interface OwnedBuildingRow extends NationBuilding {
  building_types: Pick<BuildingType, 'name' | 'category'> | null
}

export default function DashboardBuildingsList({ buildings }: { buildings: OwnedBuildingRow[] }) {
  if (buildings.length === 0) {
    return <div className={styles.emptyState}>No buildings yet.</div>
  }

  return (
    <div>
      {buildings.map((b) => (
        <div className={styles.buildingSummaryCard} key={b.id} style={{ marginBottom: 8 }}>
          <div className={styles.buildingSummaryIcon}>
            <ResourceIcon resourceType={b.building_types?.name ?? ''} />
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className={styles.buildingSummaryName}>{b.building_types?.name ?? b.building_type_id}</div>
              <div className={styles.buildingSummaryDetail}>
                {b.building_types?.category ? BUILDING_CATEGORY_LABELS[b.building_types.category] : ''}
              </div>
            </div>
            <span className={`badge ${b.status === 'ACTIVE' ? 'badge--positive' : b.status === 'STORAGE_FULL' ? 'badge--accent' : 'badge--neutral'}`}>
              {b.status === 'STORAGE_FULL' ? 'FULL' : b.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}