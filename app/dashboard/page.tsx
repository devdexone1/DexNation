import { createClient } from '@/lib/supabase/server'
import { formatNumber } from '@/lib/format'
import { BUILDING_CATEGORY_LABELS } from '@/types/database'
import type {
  Nation,
  NationStock,
  NationBuilding,
  BuildingType,
  Achievement,
  NationAchievement,
} from '@/types/database'
import NationDossierHistoryTypes from '@/components/NationDossier' // kept for type import consistency
import NationIdentityCard from './NationIdentityCard'
import WarehouseGrid from './WarehouseGrid'
import CompositeGeopoliticsCard from './CompositeGeopoliticsCard'
import OwnedBuildingsList from '@/app/dashboard/economy/OwnedBuildingsList'
import NewsTicker from '@/components/NewsTicker'
import { getServerTranslator } from '@/lib/i18n/getServerLocale'
import styles from './overview.module.css'

interface OwnedBuildingRow extends NationBuilding {
  building_types: Pick<BuildingType, 'name' | 'category'> | null
}

interface FlagRef {
  id: string
  name: string
  flag_url: string | null
}

export default async function OverviewPage() {
  const t = await getServerTranslator()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let nation: Nation | null = null
  let stocks: NationStock[] = []
  let buildings: OwnedBuildingRow[] = []
  let catalog: BuildingType[] = []
  let achievements: Achievement[] = []
  let unlockedAchievements: NationAchievement[] = []
  let economicHealth = 0
  let infrastructureIndex = 0
  let militaryReadiness = 0
  let allianceLabel: string | null = null
  let allianceMemberFlags: FlagRef[] = []
  let warOpponentFlags: FlagRef[] = []

  if (user) {
    const { data: nationData } = await supabase
      .from('nations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    nation = nationData

    if (nation) {
      const [
        govRes,
        stocksRes,
        buildingsRes,
        catalogRes,
        creditRes,
        allianceMembershipRes,
        warsRes,
        militaryRes,
        achievementsRes,
        unlockedRes,
      ] = await Promise.all([
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
        supabase.from('building_types').select('*'),
        supabase.from('nation_credit_scores').select('credit_score, credit_grade').eq('nation_id', nation.id).maybeSingle(),
        supabase.from('alliance_members').select('alliance_id, role').eq('nation_id', nation.id).maybeSingle(),
        supabase
          .from('active_wars')
          .select('id, attacker_id, defender_id')
          .or(`attacker_id.eq.${nation.id},defender_id.eq.${nation.id}`)
          .eq('war_status', 'ACTIVE'),
        supabase.from('nation_military').select('amount, morale_status').eq('nation_id', nation.id),
        supabase.from('achievements').select('*'),
        supabase.from('nation_achievements').select('*').eq('nation_id', nation.id),
      ])

      stocks = stocksRes.data ?? []
      buildings = (buildingsRes.data as OwnedBuildingRow[]) ?? []
      catalog = catalogRes.data ?? []
      achievements = achievementsRes.data ?? []
      unlockedAchievements = unlockedRes.data ?? []

      const militaryRows = militaryRes.data ?? []
      const militaryCount = militaryRows.reduce((sum, u) => sum + u.amount, 0)
      const hasMoraleZero = militaryRows.some((u) => u.morale_status === 'MORALE_ZERO')

      // Formulas identical to components/NationDossier.tsx — kept in sync intentionally, not new logic.
      economicHealth = Math.round(nation.approval_rating * 0.5 + (creditRes.data?.credit_score ?? 0) * 0.5)
      infrastructureIndex = Math.min(100, buildings.length * 4)
      militaryReadiness = Math.min(100, Math.round(militaryCount * (hasMoraleZero ? 0.5 : 1)))

      if (allianceMembershipRes.data) {
        const { data: allianceData } = await supabase
          .from('alliances')
          .select('name, tag')
          .eq('id', allianceMembershipRes.data.alliance_id)
          .maybeSingle()
        if (allianceData) {
          allianceLabel = `${allianceData.name} [${allianceData.tag}]`
        }

        const { data: fellowMembers } = await supabase
          .from('alliance_members')
          .select('nation_id')
          .eq('alliance_id', allianceMembershipRes.data.alliance_id)
          .neq('nation_id', nation.id)
          .limit(6)

        const fellowIds = (fellowMembers ?? []).map((m) => m.nation_id)
        if (fellowIds.length > 0) {
          const { data: fellowNations } = await supabase
            .from('nations')
            .select('id, name, flag_url')
            .in('id', fellowIds)
          allianceMemberFlags = fellowNations ?? []
        }
      }

      const wars = warsRes.data ?? []
      if (wars.length > 0) {
        const opponentIds = wars.map((w) => (w.attacker_id === nation!.id ? w.defender_id : w.attacker_id))
        const { data: opponentNations } = await supabase
          .from('nations')
          .select('id, name, flag_url')
          .in('id', opponentIds)
        warOpponentFlags = opponentNations ?? []
      }
    }
  }

  const { data: newsData } = await supabase
    .from('news_items')
    .select('id, message')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(10)

  const alerts: { text: string; level: 'warning' | 'neutral' }[] = []

  const nearCapacity = stocks.filter((s) => s.max_capacity > 0 && s.amount / s.max_capacity >= 0.9)
  nearCapacity.forEach((s) => {
    alerts.push({
      text: `${s.resource_type} ${t('alerts.nearCapacity')} (${formatNumber(s.amount)} / ${formatNumber(s.max_capacity)})`,
      level: 'warning',
    })
  })

  const maintenanceKit = stocks.find((s) => s.resource_type === 'Maintenance Kit')
  const hasProcessingBuilding = buildings.some((b) => b.building_types?.category === 'PROCESSING')
  if (hasProcessingBuilding && maintenanceKit && maintenanceKit.amount <= 0) {
    alerts.push({ text: t('alerts.outOfMaintenanceKit'), level: 'warning' })
  }

  if (buildings.length === 0) {
    alerts.push({ text: t('alerts.noBuildingsYet'), level: 'neutral' })
  }

  const groupedBuildings = Object.values(
    buildings.reduce<Record<string, { buildingType: BuildingType; count: number }>>((acc, b) => {
      const bt = catalog.find((c) => c.id === b.building_type_id)
      if (!bt) return acc
      if (!acc[b.building_type_id]) {
        acc[b.building_type_id] = { buildingType: bt, count: 0 }
      }
      acc[b.building_type_id].count += 1
      return acc
    }, {})
  )

  return (
    <div>
      <NewsTicker items={newsData ?? []} />

      <div className={styles.dashboardGrid}>
        {/* ===== LEFT COLUMN ===== */}
        <div className={styles.colLeft}>
          {nation ? (
            <NationIdentityCard
              name={nation.name}
              countryNumber={nation.country_number}
              leaderName={nation.leader_name}
              createdAt={nation.created_at}
              flagUrl={nation.flag_url}
              flagFrame={nation.flag_frame}
              economicHealth={economicHealth}
              infrastructureIndex={infrastructureIndex}
              achievements={achievements}
              unlockedAchievements={unlockedAchievements}
            />
          ) : null}

          <div className={`${styles.panel} card`}>
            <div className={styles.buildingsCardTitle}>Infrastructure &amp; Buildings</div>
            <div className={styles.buildingsCardSub}>
              {buildings.length} building{buildings.length === 1 ? '' : 's'} owned
            </div>
            <OwnedBuildingsList grouped={groupedBuildings} />
          </div>
        </div>

        {/* ===== CENTER COLUMN ===== */}
        <div className={styles.colCenter}>
          <div className={`${styles.panel} card`}>
            <h2 className={styles.panelTitle}>Strategic Overview</h2>
            {nation ? (
              <StrategicOverviewInline nation={nation} />
            ) : null}
          </div>

          <WarehouseGrid stocks={stocks} />

          <div className={`${styles.panel} card`}>
            <h2 className={styles.panelTitle}>Buildings Summary</h2>
            <p className={styles.panelSubtitle}>
              {groupedBuildings.length} unique building type{groupedBuildings.length === 1 ? '' : 's'} across{' '}
              {buildings.length} total structure{buildings.length === 1 ? '' : 's'}.
            </p>
            {groupedBuildings.length > 0 ? (
              <div className={styles.stockList}>
                {groupedBuildings.map((g) => (
                  <div className={styles.stockRow} key={g.buildingType.id}>
                    <span className={styles.stockName}>{g.buildingType.name}</span>
                    <span className={styles.stockAmount} style={{ marginLeft: 'auto' }}>
                      {BUILDING_CATEGORY_LABELS[g.buildingType.category] ?? g.buildingType.category} · × {g.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* ===== RIGHT COLUMN ===== */}
        <div className={styles.colRight}>
          <CompositeGeopoliticsCard
            economicHealth={economicHealth}
            militaryReadiness={militaryReadiness}
            allianceLabel={allianceLabel}
            allianceMemberFlags={allianceMemberFlags}
            warOpponentFlags={warOpponentFlags}
          />

          <div className={`${styles.panel} card`}>
            <div className={styles.alertsCardTitle}>Alerts</div>
            {alerts.length === 0 ? (
              <div className={styles.emptyState}>Nothing needs your attention right now.</div>
            ) : (
              <div className={styles.alertsList}>
                {alerts.map((a, i) => (
                  <div key={i} className={`${styles.alertRow} ${a.level === 'warning' ? styles.alertWarning : styles.alertNeutral}`}>
                    {a.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Small inline server component: Strategic Overview stat grid + history sparklines.
// Kept in this file (not a separate module) since it's tightly coupled to this
// page's data shape and isn't reused anywhere else.
async function StrategicOverviewInline({ nation }: { nation: Nation }) {
  const { formatCash, formatPercent } = await import('@/lib/format')
  const Sparkline = (await import('@/components/Sparkline')).default
  const supabase = await createClient()

  const { data: historyRows } = await supabase
    .from('nation_stats_history')
    .select('cash_balance, approval_rating, population')
    .eq('nation_id', nation.id)
    .order('recorded_tick', { ascending: true })
    .limit(14)

  const hasHistory = historyRows && historyRows.length >= 2
  const gdpPerCapita = nation.population > 0 ? nation.daily_gdp / nation.population : 0

  return (
    <div className={styles.statGrid}>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>Cash Balance</span>
        <span className={`${styles.statValue} mono`}>{formatCash(nation.cash_balance)}</span>
        {hasHistory ? <Sparkline data={historyRows!.map((h) => h.cash_balance)} color="var(--color-positive)" /> : null}
      </div>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>Approval Rating</span>
        <span className={`${styles.statValue} ${styles.statValuePositive} mono`}>{formatPercent(nation.approval_rating)}</span>
        {hasHistory ? <Sparkline data={historyRows!.map((h) => h.approval_rating)} color="var(--color-accent)" /> : null}
      </div>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>Daily GDP</span>
        <span className={`${styles.statValue} mono`}>{formatCash(nation.daily_gdp)}</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>Population</span>
        <span className={`${styles.statValue} mono`}>{formatNumber(nation.population)}</span>
        {hasHistory ? <Sparkline data={historyRows!.map((h) => h.population)} color="var(--color-ink)" /> : null}
      </div>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>GDP / Capita</span>
        <span className={`${styles.statValue} mono`}>${gdpPerCapita.toFixed(2)}</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>Tax Rate</span>
        <span className={`${styles.statValue} mono`}>10.00%</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>Political Stability</span>
        <span className={`${styles.statValue} mono`}>100.00%</span>
      </div>
    </div>
  )
}