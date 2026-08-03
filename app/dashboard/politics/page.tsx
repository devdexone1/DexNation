import { createClient } from '@/lib/supabase/server'
import type { Nation, Government, Alliance, AllianceMember } from '@/types/database'
import IdeologyPanel from './IdeologyPanel'
import AllianceSection from './AllianceSection'
import styles from './politics.module.css'

export default async function PoliticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let nation: Nation | null = null
  let government: Government | null = null
  let membership: AllianceMember | null = null
  let currentAlliance: Alliance | null = null
  let members: AllianceMember[] = []
  let memberNames: Record<string, string> = {}
  let browsableAlliances: (Alliance & { memberCount: number })[] = []

  if (user) {
    const { data: nationData } = await supabase
      .from('nations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    nation = nationData

    if (nation) {
      const [govRes, membershipRes, allAlliancesRes, allMembersRes] = await Promise.all([
        supabase.from('governments').select('*').eq('nation_id', nation.id).maybeSingle(),
        supabase.from('alliance_members').select('*').eq('nation_id', nation.id).maybeSingle(),
        supabase.from('alliances').select('*').order('created_at', { ascending: false }),
        supabase.from('alliance_members').select('*'),
      ])
      government = govRes.data
      membership = membershipRes.data
      const allAlliances = allAlliancesRes.data ?? []
      const allMembers = allMembersRes.data ?? []

      if (membership) {
        currentAlliance = allAlliances.find((a) => a.id === membership!.alliance_id) ?? null
        members = allMembers.filter((m) => m.alliance_id === membership!.alliance_id)

        const nationIds = members.map((m) => m.nation_id)
        if (nationIds.length > 0) {
          const { data: namedNations } = await supabase
            .from('nations')
            .select('id, name')
            .in('id', nationIds)
          memberNames = Object.fromEntries((namedNations ?? []).map((n) => [n.id, n.name]))
        }
      } else {
        browsableAlliances = allAlliances.map((a) => ({
          ...a,
          memberCount: allMembers.filter((m) => m.alliance_id === a.id).length,
        }))
      }
    }
  }

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.eyebrow}>Politics</div>
        <h1 className={styles.title}>Government &amp; Diplomacy</h1>
        <p className={styles.subtitle}>
          Reform your government&apos;s ideology or manage your alliance. Simplified for
          now: founding an alliance skips the Daily GDP requirement (GDP isn&apos;t
          computed yet without the Daily Tick engine), and ideology cooldown is shown for
          reference only rather than strictly enforced.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Ideology Reform</h2>
        {nation && government ? (
          <IdeologyPanel
            nationId={nation.id}
            currentIdeology={government.ideology}
            cashBalance={nation.cash_balance}
            lastChangeAt={government.last_ideology_change_at}
          />
        ) : null}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Alliance</h2>
        {nation ? (
          <AllianceSection
            nationId={nation.id}
            membership={membership}
            currentAlliance={currentAlliance}
            members={members}
            memberNames={memberNames}
            browsableAlliances={browsableAlliances}
          />
        ) : null}
      </div>
    </div>
  )
}