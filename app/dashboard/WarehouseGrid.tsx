import ResourceIcon from './ResourceIcon'
import ToolInfo from '@/components/ToolInfo'
import { formatNumber } from '@/lib/format'
import type { NationStock } from '@/types/database'
import styles from './overview.module.css'

export default function WarehouseGrid({ stocks }: { stocks: NationStock[] }) {
  return (
    <div className={`${styles.panel} card`}>
      <h2 className={styles.panelTitle}>
        National Warehouse
        <ToolInfo title="How to read this">
          Each card shows: <strong>Current Stock</strong> on the left of the number, and{' '}
          <strong>Maximum Capacity</strong> on the right (format: current / max). The bar
          fills up as you get closer to capacity — production pauses automatically once a
          resource hits 100%.
        </ToolInfo>
      </h2>
      <p className={styles.panelSubtitle}>All commodity stock vs. warehouse capacity.</p>

      {stocks.length === 0 ? (
        <div className={styles.empty}>No stock data yet.</div>
      ) : (
        <div className={styles.warehouseGrid}>
          {stocks.map((stock) => {
            const pct = stock.max_capacity ? Math.min(100, (stock.amount / stock.max_capacity) * 100) : 0
            return (
              <div className={styles.commodityCard} key={stock.resource_type}>
                <div className={styles.commodityHeader}>
                  <span className={styles.commodityIcon}>
                    <ResourceIcon resourceType={stock.resource_type} />
                  </span>
                  <span className={styles.commodityName}>{stock.resource_type}</span>
                </div>
                <div className={`${styles.commodityAmount} mono`}>
                  {formatNumber(stock.amount)} / {formatNumber(stock.max_capacity)}
                </div>
                <div className={styles.commodityBarTrack}>
                  <div className={styles.commodityBarFill} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}