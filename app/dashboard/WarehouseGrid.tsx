import ResourceIcon from './ResourceIcon'
import ToolInfo from '@/components/ToolInfo'
import { formatNumber } from '@/lib/format'
import type { NationStock } from '@/types/database'
import styles from './overview.module.css'

function barColor(pct: number): string {
  if (pct >= 90) return 'var(--color-negative)'
  if (pct >= 70) return 'var(--color-warning)'
  return 'var(--color-positive)'
}

export default function WarehouseGrid({ stocks }: { stocks: NationStock[] }) {
  return (
    <div className={`${styles.panel} card`}>
      <h2 className={styles.panelTitle}>
        National Warehouse
        <ToolInfo title="How to read this">
          Each card shows: <strong>Current Stock</strong> vs <strong>Maximum Capacity</strong>.
          Bar color: green = plenty of room, yellow = 70%+ full, red = 90%+ full
          (production pauses automatically at 100%).
        </ToolInfo>
      </h2>
      <p className={styles.panelSubtitle}>All commodity stock vs. warehouse capacity.</p>

      {stocks.length === 0 ? (
        <div className={styles.empty}>No stock data yet.</div>
      ) : (
        <div className={styles.warehouseGrid}>
          {stocks.map((stock) => {
            const pct = stock.max_capacity ? Math.min(100, (stock.amount / stock.max_capacity) * 100) : 0
            const color = barColor(pct)
            return (
              <div className={styles.commodityCard} key={stock.resource_type}>
                <div className={styles.commodityHeader}>
                  <span className={styles.commodityIcon}>
                    <ResourceIcon resourceType={stock.resource_type} />
                  </span>
                  <span className={styles.commodityName}>{stock.resource_type}</span>
                </div>
                <div className={`${styles.commodityAmount} mono`}>
                  <span>{formatNumber(stock.amount)} / {formatNumber(stock.max_capacity)}</span>
                  <span className={styles.commodityPercent} style={{ color }}>{Math.round(pct)}%</span>
                </div>
                <div className={styles.commodityBarTrack}>
                  <div className={styles.commodityBarFill} style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}