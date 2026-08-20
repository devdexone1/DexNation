import ResourceIcon from './ResourceIcon'
import ToolInfo from '@/components/ToolInfo'
import { formatNumber } from '@/lib/format'
import type { NationStock } from '@/types/database'
import styles from './overview.module.css'

function barColor(pct: number): string {
  if (pct < 25) return 'var(--color-negative)'
  if (pct < 50) return 'var(--color-warning)'
  if (pct < 75) return 'var(--color-positive)'
  return 'var(--color-info)'
}

export default function WarehouseGrid({ stocks }: { stocks: NationStock[] }) {
  return (
    <div className={styles.warehousePanel}>
      <h2 className={styles.warehousePanelTitle}>
        National Warehouse
        <ToolInfo title="How to read this" dark>
          Each card shows: <strong>Current Stock</strong> vs <strong>Maximum Capacity</strong>.
          Bar color: red = under 25% (low stock), orange = 25–50%, green = 50–75%,
          blue = 75% or higher (well stocked).
        </ToolInfo>
      </h2>
      <p className={styles.warehousePanelSubtitle}>All commodity stock vs. warehouse capacity.</p>

      {stocks.length === 0 ? (
        <div className={styles.warehouseEmpty}>No stock data yet.</div>
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