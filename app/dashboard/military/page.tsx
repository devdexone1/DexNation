import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCash, formatNumber } from '@/lib/format'
import { MILITARY_BRANCH_LABELS } from '@/types/database'
import type {
  Nation,
  NationStock,
  MilitaryUnitType,
  NationMilitaryUnit,
  NationTechnology,
  ActiveWar,
} from '@/types/database'
import UnitCatalog from './UnitCatalog'
import DeclareWarPanel from './DeclareWarPanel'
import styles from './military.module.css'

export default async function MilitaryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let nation: Nation | null = null
  let stocks: NationStock[] = []
  let unitTypes: MilitaryUnitType[] = []
  let ownedUnits: NationMilitaryUnit[] = []
  let completedTechs: NationTechnology[] = []
  let wars: (ActiveWar & { attackerName?: string; defenderName?: string })[] = []
  let hospitalCapacity = 0
  let hospitalBuildingCount = 0

  if (user) {
    const { data: nationData } = await supabase
      .from('nations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    nation = nationData

    if (nation) {
      const [stocksRes, unitTypesRes, ownedRes, techsRes, warsRes, activeBuildingsRes] = await Promise.all([
        supabase.from('nation_stocks').select('*').eq('nation_id', nation.id),
        supabase.from('military_unit_types').select('*').order('cost_cash', { ascending: true }),
        supabase.from('nation_military').select('*').eq('nation_id', nation.id),
        supabase
          .from('nation_technologies')
          .select('*')
          .eq('nation_id', nation.id)
          .eq('status', 'COMPLETED'),
        supabase
          .from('active_wars')
          .select('*')
          .or(`attacker_id.eq.${nation.id},defender_id.eq.${nation.id}`)
          .order('declared_at_tick', { ascending: false }),
        supabase
          .from('nation_buildings')
          .select('building_type_id')
          .eq('nation_id', nation.id)
          .eq('status', 'ACTIVE'),
      ])
      stocks = stocksRes.data ?? []
      unitTypes = unitTypesRes.data ?? []
      ownedUnits = ownedRes.data ?? []
      completedTechs = techsRes.data ?? []
      wars = warsRes.data ?? []

      // Step 1: which of this nation's active buildings are hospitals?
      const activeBuildingTypeIds = (activeBuildingsRes.data ?? []).map((b) => b.building_type_id)

      if (activeBuildingTypeIds.length > 0) {
        const { data: hospitalSpecsData } = await supabase
          .from('hospital_specs')
          .select('building_type_id, capacity_per_tick')
          .in('building_type_id', activeBuildingTypeIds)

        // Step 2: sum capacity across every active building that matches a hospital spec
        // (a nation can own multiple of the same hospital building, each still counts).
        const hospitalCapacityById = new Map(
          (hospitalSpecsData ?? []).map((h) => [h.building_type_id, h.capacity_per_tick])
        )

        for (const buildingTypeId of activeBuildingTypeIds) {
          const capacity = hospitalCapacityById.get(buildingTypeId)
          if (capacity !== undefined) {
            hospitalBuildingCount += 1
            hospitalCapacity += capacity
          }
        }
      }

      if (wars.length > 0) {
        const nationIds = Array.from(
          new Set(wars.flatMap((w) => [w.attacker_id, w.defender_id]))
        )
        const { data: namedNations } = await supabase
          .from('nations')
          .select('id, name')
          .in('id', nationIds)
        const nameById = new Map((namedNations ?? []).map((n) => [n.id, n.name]))
        wars = wars.map((w) => ({
          ...w,
          attackerName: nameById.get(w.attacker_id) ?? 'Unknown',
          defenderName: nameById.get(w.defender_id) ?? 'Unknown',
        }))
      }
    }
  }

  const stockByType: Record<string, number> = Object.fromEntries(
    stocks.map((s) => [s.resource_type, s.amount])
  )
  const completedTechIds = new Set(completedTechs.map((t) => t.tech_id))
  const unitTypeById = new Map(unitTypes.map((u) => [u.id, u]))

  const branches: Array<'LAND' | 'AIR' | 'NAVAL'> = ['LAND', 'AIR', 'NAVAL']
  const totalInjuredLight = ownedUnits.reduce((sum, u) => sum + u.injured_light, 0)
  const totalInjuredSevere = ownedUnits.reduce((sum, u) => sum + u.injured_severe, 0)

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.eyebrow}>Military</div>
        <h1 className={styles.title}>Armed Forces</h1>
        <p className={styles.subtitle}>
          Recruit units and manage active wars. Combat now runs as a real-time 60-second
          battle once troops arrive at their target — open a war below to dispatch an
          attack.
        </p>
        <div className={styles.walletRow}>
          <div className={styles.walletItem}>
            <span className={styles.walletLabel}>Cash</span>
            <span className={`${styles.walletValue} mono`}>{formatCash(nation?.cash_balance)}</span>
          </div>
          <div className={styles.walletItem}>
            <span className={styles.walletLabel}>Population</span>
            <span className={`${styles.walletValue} mono`}>{formatNumber(nation?.population)}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Forces</h2>
        {ownedUnits.length === 0 ? (
          <div className={styles.emptyState}>No units recruited yet.</div>
        ) : (
          <div className={styles.ownedGrid}>
            {ownedUnits.map((u) => (
              <div key={u.id} className={`${styles.ownedCard} card`}>
                <span className={styles.ownedName}>{unitTypeById.get(u.unit_type)?.name ?? u.unit_type}</span>
                <span className={styles.ownedAmount}>{formatNumber(u.amount)}</span>
                <span className={`badge ${u.morale_status === 'NORMAL' ? 'badge--positive' : 'badge--neutral'}`}>
                  {u.morale_status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Hospital &amp; Recovery</h2>
        <div className={`${styles.warsPanel} card`}>
          <div className={styles.warRow}>
            <span>Hospital buildings</span>
            <span className="mono">{hospitalBuildingCount}</span>
          </div>
          <div className={styles.warRow}>
            <span>Total healing capacity / tick</span>
            <span className="mono">{formatNumber(hospitalCapacity)}</span>
          </div>
          <div className={styles.warRow}>
            <span>Light injuries waiting</span>
            <span className="mono">{formatNumber(totalInjuredLight)}</span>
          </div>
          <div className={styles.warRow}>
            <span>Severe injuries waiting</span>
            <span className="mono">{formatNumber(totalInjuredSevere)}</span>
          </div>
          {hospitalBuildingCount === 0 && (totalInjuredLight > 0 || totalInjuredSevere > 0) ? (
            <div className={styles.catalogError} style={{ marginTop: 10 }}>
              You have injured troops but no hospital built — they will never recover.
              Build an Emergency Tent in Economy to start healing them.
            </div>
          ) : null}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Recruit Units</h2>
        {branches.map((branch) => {
          const items = unitTypes.filter((u) => u.branch === branch)
          if (items.length === 0) return null
          return (
            <div key={branch} className={styles.branchBlock}>
              <div className={styles.branchLabel}>{MILITARY_BRANCH_LABELS[branch]}</div>
              {nation ? (
                <UnitCatalog
                  nationId={nation.id}
                  units={items}
                  cashBalance={nation.cash_balance}
                  population={nation.population}
                  stockByType={stockByType}
                  completedTechIds={completedTechIds}
                />
              ) : null}
            </div>
          )
        })}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Active Wars ({wars.length})</h2>
        <div className={`${styles.warsPanel} card`}>
          {wars.length === 0 ? (
            <div className={styles.emptyState}>No active wars.</div>
          ) : (
            wars.map((w) => (
              <Link href={`/dashboard/military/war/${w.id}`} key={w.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={styles.warRow}>
                  <span className={styles.warParties}>
                    {w.attackerName} <span style={{ color: 'var(--color-ink-faint)' }}>vs</span> {w.defenderName}
                  </span>
                  <span className="badge badge--accent">{w.war_status} · Open →</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Declare War</h2>
        {nation ? <DeclareWarPanel nationId={nation.id} /> : null}
      </div>
    </div>
  )
}