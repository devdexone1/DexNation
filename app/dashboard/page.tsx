import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCash, formatNumber, formatPercent } from '@/lib/format'
import styles from './overview.module.css'
import FlagDisplay from '@/components/FlagDisplay'
import FlagStand from '@/components/FlagStand'
import type { Government, Nation, NationStock, NationBuilding, BuildingType } from '@/types/database'
import RealtimeRefresher from '@/components/RealtimeRefresher'

interface OwnedBuildingRow extends NationBuilding {
  building_types: Pick<BuildingType, 'name' | 'category'> | null
}

export default async function OverviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let nation: Nation | null = null
  let government: Government | null = null
  let stocks: NationStock[] = []
  let buildings: OwnedBuildingRow[] = []

  if (user) {
    const { data: nationData } = await supabase
      .from('nations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    nation = nationData

    if (nation) {
      const [govRes, stocksRes, buildingsRes] = await Promise.all([
        supabase.from('governments').select('*').eq('nation_id', nation.id).maybeSingle(),
        supabase
          .from('nation_stocks')
          .select('*')
          .eq('nation_id', nation.id)
          .order('resource_type', { ascending: true }),
        supabase
          .from('nation_buildings')
          .select('*, building_types(name, category)')
          .eq('nation_id', nation.id)
          .order('created_at', { ascending: false }),
      ])
      government = govRes.data
      stocks = stocksRes.data ?? []
      buildings = (buildingsRes.data as OwnedBuildingRow[]) ?? []
    }
  }

  // Simple standalone alerts — computed from data we already have.
  // (No dependency on Military/Politics/Research systems.)
  const alerts: { text: string; level: 'warning' | 'neutral' }[] = []

  const nearCapacity = stocks.filter(
    (s) => s.max_capacity > 0 && s.amount / s.max_capacity >= 0.9
  )
  nearCapacity.forEach((s) => {
    alerts.push({
      text: `${s.resource_type} is near warehouse capacity (${formatNumber(s.amount)} / ${formatNumber(s.max_capacity)}). Consider building a Warehouse Complex.`,
      level: 'warning',
    })
  })

  const maintenanceKit = stocks.find((s) => s.resource_type === 'Maintenance Kit')
  const hasProcessingBuilding = buildings.some(
    (b) => b.building_types?.category === 'PROCESSING'
  )
  if (hasProcessingBuilding && maintenanceKit && maintenanceKit.amount <= 0) {
    alerts.push({
      text: 'You are out of Maintenance Kit — processing factories will run at only 25% efficiency once production starts.',
      level: 'warning',
    })
  }

  if (buildings.length === 0) {
    alerts.push({
      text: 'You have no buildings yet. Visit Economy to construct your first factory.',
      level: 'neutral',
    })
  }

  return (
    <div>
      {nation ? (
        <RealtimeRefresher
          channelName={`dashboard-realtime-${nation.id}`}
          watches={[
            { table: 'nations', filter: `id=eq.${nation.id}` },
            { table: 'nation_stocks', filter: `nation_id=eq.${nation.id}` },
            { table: 'nation_buildings', filter: `nation_id=eq.${nation.id}` },
          ]}
        />
      ) : null}
       <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 12, marginBottom: 16 }}>
        <FlagStand flagUrl={nation?.flag_url ?? null} side="left" />
        <FlagDisplay flagUrl={nation?.flag_url ?? null} frame={nation?.flag_frame ?? 'none'} size="hero" />
        <FlagStand flagUrl={nation?.flag_url ?? null} side="right" />
      </div>

      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Nation Overview</div>
          <h1 className={styles.title}>{nation?.name}</h1>
        </div>
        <div className={styles.badges}>
          <span className="badge badge--neutral">{nation?.continent_id}</span>
          {government ? <span className="badge badge--accent">{government.ideology}</span> : null}
        </div>
      </div>

      <div className={styles.statGrid}>
        <div className={`${styles.statCard} card`}>
          <span className={styles.statLabel}>Cash Balance</span>
          <span className={`${styles.statValue} mono`}>{formatCash(nation?.cash_balance)}</span>
        </div>
        <div className={`${styles.statCard} card`}>
          <span className={styles.statLabel}>Population</span>
          <span className={`${styles.statValue} mono`}>{formatNumber(nation?.population)}</span>
        </div>
        <div className={`${styles.statCard} card`}>
          <span className={styles.statLabel}>Approval Rating</span>
          <span className={`${styles.statValue} ${styles.statValuePositive} mono`}>
            {formatPercent(nation?.approval_rating)}
          </span>
        </div>
        <div className={`${styles.statCard} card`}>
          <span className={styles.statLabel}>Daily GDP</span>
          <span className={`${styles.statValue} mono`}>{formatCash(nation?.daily_gdp)}</span>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={`${styles.panel} card`}>
          <h2 className={styles.panelTitle}>National Warehouse</h2>
          <p className={styles.panelSubtitle}>Current commodity stock vs. warehouse capacity.</p>

          {stocks.length === 0 ? (
            <div className={styles.empty}>No stock data yet.</div>
          ) : (
            <div className={styles.stockList}>
              {stocks.map((stock) => {
                const pct = stock.max_capacity
                  ? Math.min(100, (stock.amount / stock.max_capacity) * 100)
                  : 0
                return (
                  <div className={styles.stockRow} key={stock.resource_type}>
                    <span className={styles.stockName}>{stock.resource_type}</span>
                    <div className={styles.stockBar}>
                      <div className={styles.stockBarFill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`${styles.stockAmount} mono`}>
                      {formatNumber(stock.amount)} / {formatNumber(stock.max_capacity)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className={`${styles.panel} card`}>
          <h2 className={styles.panelTitle}>Nation Summary</h2>
          <p className={styles.panelSubtitle}>Core data from the nations &amp; governments tables.</p>
          <div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Continent</span>
              <span className={styles.infoValue}>{nation?.continent_id ?? '—'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Ideology</span>
              <span className={styles.infoValue}>{government?.ideology ?? '—'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Tax Rate</span>
              <span className={styles.infoValue}>
                {government ? formatPercent(government.tax_rate) : '—'}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Political Stability</span>
              <span className={styles.infoValue}>
                {government ? formatPercent(government.political_stability) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.grid2} style={{ marginTop: 16 }}>
        <div className={`${styles.panel} card`}>
          <h2 className={styles.panelTitle}>Buildings</h2>
          <p className={styles.panelSubtitle}>
            {buildings.length} building{buildings.length === 1 ? '' : 's'} owned.{' '}
            <Link href="/dashboard/economy" style={{ textDecoration: 'underline' }}>
              Manage in Economy →
            </Link>
          </p>

          {buildings.length === 0 ? (
            <div className={styles.emptyState}>No buildings yet.</div>
          ) : (
            <div className={styles.buildingsList}>
              {buildings.slice(0, 6).map((b) => (
                <div className={styles.buildingRow} key={b.id}>
                  <div>
                    <div className={styles.buildingName}>
                      {b.building_types?.name ?? b.building_type_id}
                    </div>
                    <div className={styles.buildingCategory}>{b.building_types?.category}</div>
                  </div>
                  <span
                    className={`badge ${b.status === 'ACTIVE' ? 'badge--positive' : 'badge--neutral'}`}
                  >
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${styles.panel} card`}>
          <h2 className={styles.panelTitle}>Alerts</h2>
          <p className={styles.panelSubtitle}>Things that might need your attention.</p>

          {alerts.length === 0 ? (
            <div className={styles.emptyState}>Nothing needs your attention right now.</div>
          ) : (
            <div className={styles.alertsList}>
              {alerts.map((a, i) => (
                <div
                  key={i}
                  className={`${styles.alertRow} ${a.level === 'warning' ? styles.alertWarning : styles.alertNeutral}`}
                >
                  {a.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}