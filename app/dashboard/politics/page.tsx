import { createClient } from '@/lib/supabase/server'
import type { Nation, Government, Alliance, AllianceMember, GlobalResolution, AllianceWarNotification, AllianceTreaty } from '@/types/database'
import IdeologyPanel from './IdeologyPanel'
import AllianceSection from './AllianceSection'
import UnResolutions from './UnResolutions'
import AllianceWarAlerts from './AllianceWarAlerts'
import AllianceTreaties from './AllianceTreaties'
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
  let resolutions: GlobalResolution[] = []
  let votedResolutionIds = new Set<string>()
  let nationOptions: { id: string; name: string }[] = []
  let warAlerts: (AllianceWarNotification & { allyName?: string; attackerName?: string })[] = []
  let treaties: (AllianceTreaty & { partnerName?: string })[] = []
  let otherAlliances: { id: string; name: string; tag: string }[] = []


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
      }
      if (membership) {
        const { data: notifData } = await supabase
          .from('alliance_war_notifications')
          .select('*')
          .eq('alliance_id', membership.alliance_id)
          .order('created_at', { ascending: false })
          .limit(10)

        const rawNotifs = notifData ?? []
        if (rawNotifs.length > 0) {
          const nationIds = Array.from(
            new Set(rawNotifs.flatMap((n) => [n.ally_nation_id, n.attacker_nation_id]))
          )
          const { data: notifNations } = await supabase
            .from('nations')
            .select('id, name')
            .in('id', nationIds)
          const nameById = new Map((notifNations ?? []).map((n) => [n.id, n.name]))
          warAlerts = rawNotifs.map((n) => ({
            ...n,
            allyName: nameById.get(n.ally_nation_id),
            attackerName: nameById.get(n.attacker_nation_id),
          }))
        }
        const membershipAllianceId = membership.alliance_id

        const { data: treatyData } = await supabase
          .from('alliance_treaties')
          .select('*')
          .or(`alliance_a_id.eq.${membershipAllianceId},alliance_b_id.eq.${membershipAllianceId}`)
          .order('created_at', { ascending: false })

        const rawTreaties = treatyData ?? []
        const partnerAllianceIds = rawTreaties.map((t) =>
          t.alliance_a_id === membershipAllianceId ? t.alliance_b_id : t.alliance_a_id
        )
        const { data: partnerAlliances } = await supabase
          .from('alliances')
          .select('id, name, tag')
          .in('id', partnerAllianceIds.length > 0 ? partnerAllianceIds : ['00000000-0000-0000-0000-000000000000'])
        const partnerNameById = new Map((partnerAlliances ?? []).map((a) => [a.id, `${a.name} [${a.tag}]`]))

        treaties = rawTreaties.map((t) => ({
          ...t,
          partnerName: partnerNameById.get(
            t.alliance_a_id === membershipAllianceId ? t.alliance_b_id : t.alliance_a_id
          ),
        }))

        const { data: allOtherAlliances } = await supabase
          .from('alliances')
          .select('id, name, tag')
          .neq('id', membershipAllianceId)
        otherAlliances = allOtherAlliances ?? []

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
        <AllianceWarAlerts notifications={warAlerts} />
        {nation && membership ? (
          <div style={{ marginBottom: 16 }}>
            <AllianceTreaties
              nationId={nation.id}
              currentAllianceId={membership.alliance_id}
              isLeader={membership.role === 'LEADER'}
              treaties={treaties}
              otherAlliances={otherAlliances}
            />
          </div>
        ) : null}
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

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>United Nations</h2>
        {nation ? (
          <UnResolutions
            nationId={nation.id}
            resolutions={resolutions}
            votedResolutionIds={votedResolutionIds}
            nationOptions={nationOptions}
          />
        ) : null}
      </div>
    </div>
  )
}