import { createClient } from '@/lib/supabase/server'
import { formatCash, formatNumber } from '@/lib/format'
import { BUILDING_CATEGORY_LABELS } from '@/types/database'
import type { Nation, NationStock, NationBuilding, BuildingType } from '@/types/database'
import BuildingCatalog from './BuildingCatalog'
import styles from './economy.module.css'

interface OwnedBuildingRow extends NationBuilding {
  building_types: Pick<BuildingType, 'name' | 'category'> | null
}

export default async function EconomyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let nation: Nation | null = null
  let stocks: NationStock[] = []
  let ownedBuildings: OwnedBuildingRow[] = []
  let catalog: BuildingType[] = []

  if (user) {
    const { data: nationData } = await supabase
      .from('nations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    nation = nationData

    if (nation) {
      const [stocksRes, buildingsRes, catalogRes] = await Promise.all([
        supabase.from('nation_stocks').select('*').eq('nation_id', nation.id),
        supabase
          .from('nation_buildings')
          .select('*, building_types(name, category)')
          .eq('nation_id', nation.id)
          .order('created_at', { ascending: false }),
        supabase.from('building_types').select('*').order('cost_cash', { ascending: true }),
      ])
      stocks = stocksRes.data ?? []
      ownedBuildings = (buildingsRes.data as OwnedBuildingRow[]) ?? []
      catalog = catalogRes.data ?? []
    }
  }

  const steelStock = stocks.find((s) => s.resource_type === 'Steel')
  const steelAmount = steelStock?.amount ?? 0

  // Exclude the freebie starter warehouse from the purchasable catalogue.
  const buildableCatalog = catalog.filter((c) => c.id !== 'starter_warehouse')

  const catalogByCategory = buildableCatalog.reduce<Record<string, BuildingType[]>>((acc, bt) => {
    acc[bt.category] = acc[bt.category] ? [...acc[bt.category], bt] : [bt]
    return acc
  }, {})

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.eyebrow}>Economy</div>
        <h1 className={styles.title}>Industry &amp; Production</h1>
        <p className={styles.subtitle}>
          Manage your factories and construct new buildings. Production runs automatically
          every day at 00:00 UTC via the Daily Tick engine — check back after each tick to
          see your stockpiles grow.
        </p>
        <div className={styles.walletRow}>
          <div className={styles.walletItem}>
            <span className={styles.walletLabel}>Cash</span>
            <span className={`${styles.walletValue} mono`}>{formatCash(nation?.cash_balance)}</span>
          </div>
          <div className={styles.walletItem}>
            <span className={styles.walletLabel}>Steel</span>
            <span className={`${styles.walletValue} mono`}>{formatNumber(steelAmount)}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Buildings ({ownedBuildings.length})</h2>
        {ownedBuildings.length === 0 ? (
          <div className={styles.emptyState}>
            You don&apos;t own any buildings yet — construct your first one below.
          </div>
        ) : (
          <div className={styles.ownedGrid}>
            {ownedBuildings.map((b) => (
              <div key={b.id} className={`${styles.ownedCard} card`}>
                <span className={styles.ownedName}>{b.building_types?.name ?? b.building_type_id}</span>
                <span className={styles.ownedCategory}>
                  {b.building_types?.category ? BUILDING_CATEGORY_LABELS[b.building_types.category] : ''}
                </span>
                <span
                  className={`badge ${b.status === 'ACTIVE' ? 'badge--positive' : 'badge--neutral'}`}
                  style={{ width: 'fit-content' }}
                >
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Construct New Building</h2>

        {Object.entries(BUILDING_CATEGORY_LABELS).map(([categoryKey, label]) => {
          const items = catalogByCategory[categoryKey]
          if (!items || items.length === 0) return null

          return (
            <div key={categoryKey} className={styles.categoryBlock}>
              <div className={styles.categoryLabel}>{label}</div>
              {nation ? (
                <BuildingCatalog
                  nationId={nation.id}
                  buildingTypes={items}
                  cashBalance={nation.cash_balance}
                  steelAmount={steelAmount}
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}