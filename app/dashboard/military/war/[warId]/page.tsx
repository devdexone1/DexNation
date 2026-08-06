import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Nation, TroopMovement, BattleLog } from '@/types/database'
import DispatchAttackForm from './DispatchAttackForm'
import TroopMovementsList from './TroopMovementsList'
import BattleLogItem from './BattleLogItem'
import NavalBlockadePanel from './NavalBlockadePanel'
import styles from './war-room.module.css'

export default async function WarRoomPage({
  params,
}: {
  params: Promise<{ warId: string }>
}) {
  const { warId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let nation: Nation | null = null
  let war: { id: string; attacker_id: string; defender_id: string; war_status: string } | null = null
  let attackerName = 'Unknown'
  let defenderName = 'Unknown'
  let deployableUnits: { unit_type: string; name: string; amount: number }[] = []
  let deployableNavalUnits: { unit_type: string; name: string; amount: number }[] = []
  let blockadeHolder: { nation_id: string; nation_name: string; unit_name: string; amount: number } | null = null
  let movements: TroopMovement[] = []
  let battles: BattleLog[] = []
  let unitNameById: Record<string, string> = {}

  if (user) {
    const { data: nationData } = await supabase
      .from('nations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    nation = nationData

    const { data: warData } = await supabase
      .from('active_wars')
      .select('id, attacker_id, defender_id, war_status')
      .eq('id', warId)
      .maybeSingle()
    war = warData

    if (war) {
      const { data: nationsInvolved } = await supabase
        .from('nations')
        .select('id, name')
        .in('id', [war.attacker_id, war.defender_id])
      const nameById = new Map((nationsInvolved ?? []).map((n) => [n.id, n.name]))
      attackerName = nameById.get(war.attacker_id) ?? 'Unknown'
      defenderName = nameById.get(war.defender_id) ?? 'Unknown'

      const [movementsRes, battlesRes, unitTypesRes] = await Promise.all([
        supabase
          .from('troop_movements')
          .select('*')
          .eq('war_id', warId)
          .eq('status', 'EN_ROUTE')
          .order('arrival_at', { ascending: true }),
        supabase
          .from('battle_logs')
          .select('*')
          .eq('war_id', warId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('military_unit_types').select('id, name'),
      ])
      movements = movementsRes.data ?? []
      battles = (battlesRes.data as BattleLog[]) ?? []
      unitNameById = Object.fromEntries((unitTypesRes.data ?? []).map((u) => [u.id, u.name]))

      if (nation && (nation.id === war.attacker_id || nation.id === war.defender_id)) {
        const { data: units } = await supabase
          .from('nation_military')
          .select('unit_type, amount, military_unit_types(name, branch)')
          .eq('nation_id', nation.id)
          .gt('amount', 0)

        if (nation.id === war.attacker_id) {
          deployableUnits = (units ?? [])
            .filter((u: any) => u.military_unit_types?.branch === 'LAND')
            .map((u: any) => ({ unit_type: u.unit_type, name: u.military_unit_types.name, amount: u.amount }))
        }

        deployableNavalUnits = (units ?? [])
          .filter((u: any) => u.military_unit_types?.branch === 'NAVAL')
          .map((u: any) => ({ unit_type: u.unit_type, name: u.military_unit_types.name, amount: u.amount }))
      }

      const { data: holdingDeployment } = await supabase
        .from('naval_deployments')
        .select('nation_id, unit_type, amount, military_unit_types(name)')
        .eq('war_id', warId)
        .eq('status', 'HOLDING')
        .maybeSingle()

      if (holdingDeployment) {
        blockadeHolder = {
          nation_id: holdingDeployment.nation_id,
          nation_name: holdingDeployment.nation_id === war.attacker_id ? attackerName : defenderName,
          unit_name: (holdingDeployment as any).military_unit_types?.name ?? holdingDeployment.unit_type,
          amount: holdingDeployment.amount,
        }
      }
    }
  }

  if (!war) {
    return (
      <div>
        <Link href="/dashboard/military" className={styles.backLink}>
          ← Back to Military
        </Link>
        <div className={styles.emptyState}>War not found.</div>
      </div>
    )
  }

  const isAttacker = nation?.id === war.attacker_id

  return (
    <div>
      <Link href="/dashboard/military" className={styles.backLink}>
        ← Back to Military
      </Link>

      <div className={styles.header}>
        <div className={styles.eyebrow}>War Room</div>
        <h1 className={styles.title}>
          {attackerName} vs {defenderName}
        </h1>
      </div>

      {isAttacker && war.war_status === 'ACTIVE' ? (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Dispatch Attack</h2>
          <DispatchAttackForm
            warId={war.id}
            attackerNationId={nation!.id}
            deployableUnits={deployableUnits}
          />
        </div>
      ) : null}

      {(nation?.id === war.attacker_id || nation?.id === war.defender_id) && war.war_status === 'ACTIVE' ? (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Naval Blockade</h2>
          <NavalBlockadePanel
            warId={war.id}
            nationId={nation!.id}
            holder={blockadeHolder}
            deployableUnits={deployableNavalUnits}
          />
        </div>
      ) : null}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Troops En Route ({movements.length})</h2>
        <TroopMovementsList movements={movements} unitNameById={unitNameById} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Battle History ({battles.length})</h2>
        {battles.length === 0 ? (
          <div className={styles.emptyState}>No battles fought yet in this war.</div>
        ) : (
          battles.map((b) => (
            <BattleLogItem
              key={b.id}
              battle={b}
              attackerName={attackerName}
              defenderName={defenderName}
            />
          ))
        )}
      </div>
    </div>
  )
}