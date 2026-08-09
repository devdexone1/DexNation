import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCash, formatNumber, formatPercent, formatNationAge } from '@/lib/format'
import FlagDisplay from '@/components/FlagDisplay'
import DeclareWarFromProfile from './DeclareWarFromProfile'
import NationDossier from '@/components/NationDossier'
import type { Achievement, NationAchievement } from '@/types/database'
import AllianceBadgeButton from '@/components/AllianceBadgeButton'
import styles from './nation-profile.module.css'

export default async function NationProfilePage({
  params,
}: {
  params: Promise<{ nationId: string }>
}) {
  const { nationId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: nation } = await supabase.from('nations').select('*').eq('id', nationId).maybeSingle()

  if (!nation) {
    return (
      <div className={styles.emptyState}>Nation not found.</div>
    )
  }

  const [govRes, membershipRes, warsRes, listingsRes, battlesRes, viewerNationRes, buildingsCountRes, techCountRes, creditRes, militaryRes, achievementsRes, unlockedRes] = await Promise.all([
    supabase.from('governments').select('ideology, tax_rate, political_stability').eq('nation_id', nationId).maybeSingle(),
    supabase.from('alliance_members').select('alliance_id, role').eq('nation_id', nationId).maybeSingle(),
    supabase
      .from('active_wars')
      .select('*')
      .or(`attacker_id.eq.${nationId},defender_id.eq.${nationId}`)
      .eq('war_status', 'ACTIVE'),
    supabase
      .from('p2p_market_orders')
      .select('*')
      .eq('seller_nation_id', nationId)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('battle_logs')
      .select('*')
      .or(`attacker_nation_id.eq.${nationId},defender_nation_id.eq.${nationId}`)
      .order('created_at', { ascending: false })
      .limit(5),
    user
      ? supabase.from('nations').select('id, name').eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('nation_buildings').select('id', { count: 'exact', head: true }).eq('nation_id', nationId),
    supabase.from('nation_technologies').select('id', { count: 'exact', head: true }).eq('nation_id', nationId).eq('status', 'COMPLETED'),
    supabase.from('nation_credit_scores').select('credit_score, credit_grade').eq('nation_id', nationId).maybeSingle(),
    supabase.from('nation_military').select('amount, morale_status').eq('nation_id', nationId),
    supabase.from('achievements').select('*'),
    supabase.from('nation_achievements').select('*').eq('nation_id', nationId),
  ])

  const government = govRes.data
  const membership = membershipRes.data
  const wars = warsRes.data ?? []
  const listings = listingsRes.data ?? []
  const battles = battlesRes.data ?? []
  const viewerNation = viewerNationRes.data as { id: string; name: string } | null

  let allianceInfo: { id: string; name: string; tag: string } | null = null
  if (membership) {
    const { data: allianceData } = await supabase
      .from('alliances')
      .select('id, name, tag')
      .eq('id', membership.alliance_id)
      .maybeSingle()
    allianceInfo = allianceData
  }

  // Resolve names for war opponents / battle opponents.
  const relatedIds = new Set<string>()
  wars.forEach((w) => { relatedIds.add(w.attacker_id); relatedIds.add(w.defender_id) })
  battles.forEach((b) => { relatedIds.add(b.attacker_nation_id); relatedIds.add(b.defender_nation_id) })
  relatedIds.delete(nationId)

  const nameById = new Map<string, string>()
  if (relatedIds.size > 0) {
    const { data: relatedNations } = await supabase.from('nations').select('id, name').in('id', Array.from(relatedIds))
    for (const n of relatedNations ?? []) nameById.set(n.id, n.name)
  }
  let viewerAllianceId: string | null = null
  if (viewerNation) {
    const { data: viewerMembership } = await supabase
      .from('alliance_members')
      .select('alliance_id')
      .eq('nation_id', viewerNation.id)
      .maybeSingle()
    viewerAllianceId = viewerMembership?.alliance_id ?? null
  }
  const isOwnProfile = viewerNation?.id === nationId
  const alreadyAtWar = wars.some(
    (w) => w.attacker_id === viewerNation?.id || w.defender_id === viewerNation?.id
  )

  return (
    <div>
      <div className={styles.header}>
        <FlagDisplay flagUrl={nation.flag_url} frame={nation.flag_frame} size="hero" />
        <h1 className={styles.title}>{nation.name}</h1>
        <div className={styles.badges}>
          <span className="badge badge--neutral">{nation.continent_id}</span>
          {government ? <span className="badge badge--accent">{government.ideology}</span> : null}
          {allianceInfo ? (
            <AllianceBadgeButton
              allianceId={allianceInfo.id}
              label={`${allianceInfo.name} [${allianceInfo.tag}]`}
              viewerNationId={viewerNation?.id ?? null}
              viewerAllianceId={viewerAllianceId}
            />
          ) : null}
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-ink-faint)', marginTop: 8 }}>
          Founded {formatNationAge(nation.created_at)} ago
        </p>
      </div>

      <div className={styles.statGrid}>
        <div className={`${styles.statCard} card`}>
          <span className={styles.statLabel}>Population</span>
          <span className={`${styles.statValue} mono`}>{formatNumber(nation.population)}</span>
        </div>
        <div className={`${styles.statCard} card`}>
          <span className={styles.statLabel}>Approval Rating</span>
          <span className={`${styles.statValue} mono`}>{formatPercent(nation.approval_rating)}</span>
        </div>
        <div className={`${styles.statCard} card`}>
          <span className={styles.statLabel}>Daily GDP</span>
          <span className={`${styles.statValue} mono`}>{formatCash(nation.daily_gdp)}</span>
        </div>
      </div>

      <div className={`${styles.highlightBar} card`}>
        <div className={styles.highlightItem}>
          <div className={styles.highlightValue}>{formatNumber(buildingsCountRes.count ?? 0)}</div>
          <div className={styles.highlightLabel}>Buildings</div>
        </div>
        <div className={styles.highlightItem}>
          <div className={styles.highlightValue}>{formatNumber(techCountRes.count ?? 0)}</div>
          <div className={styles.highlightLabel}>Tech Completed</div>
        </div>
        <div className={styles.highlightItem}>
          <div className={styles.highlightValue}>{wars.length}</div>
          <div className={styles.highlightLabel}>Active Wars</div>
        </div>
        <div className={styles.highlightItem}>
          <div className={styles.highlightValue}>{battles.filter((b) => b.winner === (b.attacker_nation_id === nationId ? 'ATTACKER' : 'DEFENDER')).length}</div>
          <div className={styles.highlightLabel}>Battles Won</div>
        </div>
      </div>

      <NationDossier
        data={{
          name: nation.name,
          leaderName: nation.leader_name,
          ideology: government?.ideology ?? '—',
          continentId: nation.continent_id,
          createdAt: nation.created_at,
          dailyGdp: nation.daily_gdp,
          population: nation.population,
          taxRate: government?.tax_rate ?? 0,
          politicalStability: government?.political_stability ?? 0,
          approvalRating: nation.approval_rating,
          creditScore: creditRes.data?.credit_score ?? null,
          creditGrade: creditRes.data?.credit_grade ?? null,
          allianceLabel: allianceInfo ? `${allianceInfo.name} [${allianceInfo.tag}]` : null,
          activeWarsCount: wars.length,
          buildingCount: buildingsCountRes.count ?? 0,
          militaryCount: (militaryRes.data ?? []).reduce((sum, u) => sum + u.amount, 0),
          hasMoraleZero: (militaryRes.data ?? []).some((u) => u.morale_status === 'MORALE_ZERO'),
        }}
        achievements={achievementsRes.data ?? []}
        unlockedAchievements={unlockedRes.data ?? []}
      />

      {viewerNation && !isOwnProfile ? (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Actions</h2>
          {alreadyAtWar ? (
            <div className={styles.actionRow}>
              <span className="badge badge--neutral">Already at war</span>
            </div>
          ) : (
            <DeclareWarFromProfile viewerNationId={viewerNation.id} targetNationId={nationId} />
          )}
        </div>
      ) : null}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Active Wars ({wars.length})</h2>
        <div className={`${styles.panel} card`}>
          {wars.length === 0 ? (
            <div className={styles.emptyState}>Not currently at war.</div>
          ) : (
            wars.map((w) => (
              <Link href={`/dashboard/military/war/${w.id}`} key={w.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={styles.row}>
                  <span>
                    {w.attacker_id === nationId ? 'Attacking' : 'Defending against'}{' '}
                    <strong>{nameById.get(w.attacker_id === nationId ? w.defender_id : w.attacker_id) ?? 'Unknown'}</strong>
                  </span>
                  <span className="badge badge--accent">Open →</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Market Listings ({listings.length})</h2>
        <div className={`${styles.panel} card`}>
          {listings.length === 0 ? (
            <div className={styles.emptyState}>No active listings.</div>
          ) : (
            listings.map((l) => (
              <div className={styles.row} key={l.id}>
                <span>{formatNumber(l.remaining_quantity)} {l.resource_type}</span>
                <span className="mono">{formatCash(l.unit_price_cash)}/unit</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent Battles</h2>
        <div className={`${styles.panel} card`}>
          {battles.length === 0 ? (
            <div className={styles.emptyState}>No recorded battles.</div>
          ) : (
            battles.map((b) => (
              <div className={styles.row} key={b.id}>
                <span>
                  vs <strong>{nameById.get(b.attacker_nation_id === nationId ? b.defender_nation_id : b.attacker_nation_id) ?? 'Unknown'}</strong>
                  {b.is_naval ? ' (Naval)' : ' (Ground)'}
                </span>
                <span className={`badge ${b.winner === (b.attacker_nation_id === nationId ? 'ATTACKER' : 'DEFENDER') ? 'badge--positive' : 'badge--neutral'}`}>
                  {b.winner === (b.attacker_nation_id === nationId ? 'ATTACKER' : 'DEFENDER') ? 'Won' : 'Lost'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}