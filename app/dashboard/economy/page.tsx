import { createClient } from '@/lib/supabase/server'
import { formatCash, formatNumber } from '@/lib/format'
import OwnedBuildingsList from './OwnedBuildingsList'
import { getServerTranslator } from '@/lib/i18n/getServerLocale'
import { BUILDING_CATEGORY_LABELS } from '@/types/database'
import type { Nation, NationStock, NationBuilding, BuildingType } from '@/types/database'
import ToolInfo from '@/components/ToolInfo'
import BuildingCatalog from './BuildingCatalog'
import styles from './economy.module.css'

interface OwnedBuildingRow extends NationBuilding {
  building_types: Pick<BuildingType, 'name' | 'category'> | null
}

export default async function EconomyPage() {
  const t = await getServerTranslator()
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
        <div className={styles.eyebrow}>{t('economy.eyebrow')}</div>
        <h1 className={styles.title}>{t('economy.title')}</h1>
        <p className={styles.subtitle}>{t('economy.subtitle')}</p>
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
        <div className={`${styles.panel} card`}>
          <OwnedBuildingsList
            nationId={nation?.id || ''}
            buildings={ownedBuildings}
            catalog={catalog}
          />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Construct New Building
          <ToolInfo title="Building Production">
            Each building consumes raw materials/electricity and produces goods
            automatically once per Day. Efficiency drops if you run low on Maintenance
            Kit (floor 25%) or electricity. Watch your warehouse — production pauses if
            storage fills up.
          </ToolInfo>
        </h2>

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