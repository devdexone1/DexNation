import { createClient } from '@/lib/supabase/server'
import { formatCash, formatNumber } from '@/lib/format'
import { BUILDING_CATEGORY_LABELS } from '@/types/database'
import type { Nation, NationStock, NationBuilding, BuildingType, Achievement, NationAchievement } from '@/types/database'
import NationDossier from '@/components/NationDossier'
import ToolInfo from '@/components/ToolInfo'
import { getServerTranslator } from '@/lib/i18n/getServerLocale'
import NewsTicker from '@/components/NewsTicker'
import styles from './overview.module.css'

interface OwnedBuildingRow extends NationBuilding {
  building_types: Pick<BuildingType, 'name' | 'category'> | null
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
  let dossierData: import('@/components/NationDossier').NationDossierData | null = null
  let achievements: Achievement[] = []
  let unlockedAchievements: NationAchievement[] = []

  if (user) {
    const { data: nationData } = await supabase
      .from('nations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    nation = nationData

    if (nation) {
      const [govRes, stocksRes, buildingsRes, creditRes, allianceMembershipRes, warsCountRes, militaryRes, achievementsRes, unlockedRes] =
        await Promise.all([
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
          supabase.from('nation_credit_scores').select('credit_score, credit_grade').eq('nation_id', nation.id).maybeSingle(),
          supabase.from('alliance_members').select('alliance_id, role').eq('nation_id', nation.id).maybeSingle(),
          supabase
            .from('active_wars')
            .select('id', { count: 'exact', head: true })
            .or(`attacker_id.eq.${nation.id},defender_id.eq.${nation.id}`)
            .eq('war_status', 'ACTIVE'),
          supabase.from('nation_military').select('amount, morale_status').eq('nation_id', nation.id),
          supabase.from('achievements').select('*'),
          supabase.from('nation_achievements').select('*').eq('nation_id', nation.id),
        ])

      stocks = stocksRes.data ?? []
      buildings = (buildingsRes.data as OwnedBuildingRow[]) ?? []

      let allianceLabel: string | null = null
      if (allianceMembershipRes.data) {
        const { data: allianceData } = await supabase
          .from('alliances')
          .select('name, tag')
          .eq('id', allianceMembershipRes.data.alliance_id)
          .maybeSingle()
        if (allianceData) {
          allianceLabel = `${allianceData.name} [${allianceData.tag}] · ${allianceMembershipRes.data.role}`
        }
      }

      const militaryRows = militaryRes.data ?? []

      dossierData = {
        name: nation.name,
        countryNumber: nation.country_number,
        cashBalance: nation.cash_balance,
        leaderName: nation.leader_name,
        ideology: govRes.data?.ideology ?? '—',
        continentId: nation.continent_id,
        createdAt: nation.created_at,
        dailyGdp: nation.daily_gdp,
        population: nation.population,
        taxRate: govRes.data?.tax_rate ?? 0,
        politicalStability: govRes.data?.political_stability ?? 0,
        approvalRating: nation.approval_rating,
        creditScore: creditRes.data?.credit_score ?? null,
        creditGrade: creditRes.data?.credit_grade ?? null,
        allianceLabel,
        activeWarsCount: warsCountRes.count ?? 0,
        buildingCount: buildings.length,
        militaryCount: militaryRows.reduce((sum, u) => sum + u.amount, 0),
        hasMoraleZero: militaryRows.some((u) => u.morale_status === 'MORALE_ZERO'),
        flagUrl: nation.flag_url,
        flagFrame: nation.flag_frame,
      }

      achievements = achievementsRes.data ?? []
      unlockedAchievements = unlockedRes.data ?? []
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

  return (
    <div>
      <NewsTicker items={newsData ?? []} />

      {/* 1. STATISTICS FIRST — always the first thing a player sees on login */}
      {dossierData ? (
        <div style={{ marginBottom: 16 }}>
          <NationDossier data={dossierData} achievements={achievements} unlockedAchievements={unlockedAchievements} isOwnNation />
        </div>
      ) : null}

      {/* 2. WAREHOUSE SECOND */}
      <div className={`${styles.panel} card`} style={{ marginBottom: 16 }}>
        <h2 className={styles.panelTitle}>
          National Warehouse
          <ToolInfo title="How to read this">
            Each row shows: <strong>Current Stock</strong> on the left of the bar, and{' '}
            <strong>Maximum Capacity</strong> on the right (format: current / max). The
            bar fills up as you get closer to capacity — production pauses automatically
            once a resource hits 100%.
          </ToolInfo>
        </h2>
        <p className={styles.panelSubtitle}>Current commodity stock vs. warehouse capacity.</p>

        {stocks.length === 0 ? (
          <div className={styles.empty}>No stock data yet.</div>
        ) : (
          <div className={styles.stockList}>
            {stocks.map((stock) => {
              const pct = stock.max_capacity ? Math.min(100, (stock.amount / stock.max_capacity) * 100) : 0
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

      {/* 3. BUILDINGS + ALERTS */}
      <div className={styles.grid2}>
        <div className={`${styles.panel} card`}>
          <h2 className={styles.panelTitle}>Buildings</h2>
          <p className={styles.panelSubtitle}>
            {buildings.length} building{buildings.length === 1 ? '' : 's'} owned.
          </p>

          {buildings.length === 0 ? (
            <div className={styles.emptyState}>No buildings yet.</div>
          ) : (
            <div className={styles.buildingsList}>
              {buildings.slice(0, 6).map((b) => (
                <div className={styles.buildingRow} key={b.id}>
                  <div>
                    <div className={styles.buildingName}>{b.building_types?.name ?? b.building_type_id}</div>
                    <div className={styles.buildingCategory}>
                      {b.building_types?.category ? BUILDING_CATEGORY_LABELS[b.building_types.category] : ''}
                    </div>
                  </div>
                  <span className={`badge ${b.status === 'ACTIVE' ? 'badge--positive' : b.status === 'STORAGE_FULL' ? 'badge--accent' : 'badge--neutral'}`}>
                    {b.status === 'STORAGE_FULL' ? 'WAREHOUSE FULL' : b.status}
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
                <div key={i} className={`${styles.alertRow} ${a.level === 'warning' ? styles.alertWarning : styles.alertNeutral}`}>
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