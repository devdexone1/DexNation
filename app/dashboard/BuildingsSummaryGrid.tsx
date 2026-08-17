import ResourceIcon from './ResourceIcon'
import { formatNumber } from '@/lib/format'
import type { BuildingType } from '@/types/database'
import styles from './overview.module.css'

interface GroupedBuilding {
  buildingType: BuildingType
  count: number
}

export default function BuildingsSummaryGrid({ grouped }: { grouped: GroupedBuilding[] }) {
  if (grouped.length === 0) return null

  return (
    <div className={styles.buildingsSummaryGrid}>
      {grouped.map((g) => {
        const outputs = Object.entries(g.buildingType.output_resources ?? {})
        const outputText = outputs.length > 0 ? `+${formatNumber(outputs[0][1])} ${outputs[0][0]}/day` : '—'
        const iconResource = outputs[0]?.[0] ?? 'Steel'

        return (
          <div className={styles.buildingSummaryCard} key={g.buildingType.id}>
            <div className={styles.buildingSummaryIcon}>
              <ResourceIcon resourceType={iconResource} />
            </div>
            <div>
              <div className={styles.buildingSummaryName}>{g.buildingType.name}</div>
              {/* NOTE: "Level" is a cosmetic placeholder — DexNation doesn't
                  have a building-leveling mechanic yet. See summary at the
                  end of this response for why this is flagged as unbuilt. */}
              <div className={styles.buildingSummaryDetail}>
                Quantity: {g.count} · Level: 1 · {outputText}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}