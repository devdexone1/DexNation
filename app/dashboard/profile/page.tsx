import { createClient } from '@/lib/supabase/server'
import { formatNumber } from '@/lib/format'
import type { Nation, Government, AllianceMember, Alliance, CreditStatus } from '@/types/database'
import RenameNationForm from './RenameNationForm'
import LeaderNameForm from './LeaderNameForm'
import FlagUploadForm from './FlagUploadForm'
import SignOutButton from './SignOutButton'
import styles from './profile.module.css'
import LeaderPhotoUploadForm from './LeaderPhotoUploadForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let nation: Nation | null = null
  let government: Government | null = null
  let alliance: Alliance | null = null
  let stats = {
    buildings: 0,
    units: 0,
    techCompleted: 0,
    trades: 0,
    wars: 0,
  }
  let creditGrade = '—'

  if (user && nation === null) {
    const { data: nationData } = await supabase
      .from('nations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    nation = nationData

    if (nation) {
      const [
        govRes,
        membershipRes,
        buildingsRes,
        unitsRes,
        techRes,
        tradesRes,
        warsRes,
        statusRes,
      ] = await Promise.all([
        supabase.from('governments').select('*').eq('nation_id', nation.id).maybeSingle(),
        supabase.from('alliance_members').select('*').eq('nation_id', nation.id).maybeSingle(),
        supabase.from('nation_buildings').select('id', { count: 'exact', head: true }).eq('nation_id', nation.id),
        supabase.from('nation_military').select('amount').eq('nation_id', nation.id),
        supabase
          .from('nation_technologies')
          .select('id', { count: 'exact', head: true })
          .eq('nation_id', nation.id)
          .eq('status', 'COMPLETED'),
        supabase
          .from('p2p_trade_history')
          .select('id', { count: 'exact', head: true })
          .or(`seller_nation_id.eq.${nation.id},buyer_nation_id.eq.${nation.id}`),
        supabase
          .from('active_wars')
          .select('id', { count: 'exact', head: true })
          .or(`attacker_id.eq.${nation.id},defender_id.eq.${nation.id}`),
        supabase.rpc('compute_credit_status', { p_nation_id: nation.id }),
      ])

      government = govRes.data

      const membership = membershipRes.data as AllianceMember | null
      if (membership) {
        const { data: allianceData } = await supabase
          .from('alliances')
          .select('*')
          .eq('id', membership.alliance_id)
          .maybeSingle()
        alliance = allianceData
      }

      const unitTotal = (unitsRes.data ?? []).reduce((sum, u) => sum + (u.amount ?? 0), 0)

      stats = {
        buildings: buildingsRes.count ?? 0,
        units: unitTotal,
        techCompleted: techRes.count ?? 0,
        trades: tradesRes.count ?? 0,
        wars: warsRes.count ?? 0,
      }

      const status = (statusRes.data as CreditStatus[] | null)?.[0] ?? null
      creditGrade = status?.credit_grade ?? '—'
    }
  }

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? 'Player'
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.eyebrow}>Profile</div>
        <h1 className={styles.title}>Account &amp; Nation Settings</h1>
        <p className={styles.subtitle}>Manage your account details and nation identity.</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Account</h2>
        <div className={`${styles.accountCard} card`}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={fullName} className={styles.avatar} />
          ) : (
            <div className={styles.avatarFallback}>{fullName.charAt(0).toUpperCase()}</div>
          )}
          <div className={styles.accountInfo}>
            <span className={styles.accountEmail}>{user?.email}</span>
            <span className={styles.accountMeta}>Signed in with Google · Member since {memberSince}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Nation Identity</h2>
        <div className={`${styles.panel} card`}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Continent</span>
            <span className={styles.infoValue}>{nation?.continent_id ?? '—'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Ideology</span>
            <span className={styles.infoValue}>{government?.ideology ?? '—'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Alliance</span>
            <span className={styles.infoValue}>
              {alliance ? `${alliance.name} [${alliance.tag}]` : 'None'}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Founded</span>
            <span className={styles.infoValue}>
              {nation?.created_at ? new Date(nation.created_at).toLocaleDateString() : '—'}
            </span>
          </div>

          {nation ? <RenameNationForm nationId={nation.id} currentName={nation.name} /> : null}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
            <label className="field__label" style={{ marginBottom: 6, display: 'block' }}>Leader / President Name</label>
            {nation ? <LeaderNameForm nationId={nation.id} currentLeaderName={nation.leader_name} /> : null}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Flag</h2>
        {nation && user ? (
          <FlagUploadForm
            userId={user.id}
            nationId={nation.id}
            currentFlagUrl={nation.flag_url}
            currentFrame={nation.flag_frame}
          />
        ) : null}
      </div>
      

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Leader Photo</h2>
        {nation && user ? (
          <LeaderPhotoUploadForm userId={user.id} nationId={nation.id} currentPhotoUrl={nation.leader_photo_url} />
        ) : null}
      </div>
      
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Nation Stats</h2>
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} card`}>
            <span className={styles.statLabel}>Buildings</span>
            <span className={`${styles.statValue} mono`}>{formatNumber(stats.buildings)}</span>
          </div>
          <div className={`${styles.statCard} card`}>
            <span className={styles.statLabel}>Military Units</span>
            <span className={`${styles.statValue} mono`}>{formatNumber(stats.units)}</span>
          </div>
          <div className={`${styles.statCard} card`}>
            <span className={styles.statLabel}>Tech Completed</span>
            <span className={`${styles.statValue} mono`}>{formatNumber(stats.techCompleted)}</span>
          </div>
          <div className={`${styles.statCard} card`}>
            <span className={styles.statLabel}>Trades Made</span>
            <span className={`${styles.statValue} mono`}>{formatNumber(stats.trades)}</span>
          </div>
          <div className={`${styles.statCard} card`}>
            <span className={styles.statLabel}>Wars</span>
            <span className={`${styles.statValue} mono`}>{formatNumber(stats.wars)}</span>
          </div>
          <div className={`${styles.statCard} card`}>
            <span className={styles.statLabel}>Credit Grade</span>
            <span className={`${styles.statValue} mono`}>{creditGrade}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={`${styles.signOutRow} card`}>
          <span className={styles.signOutText}>Sign out of your DexNation account on this device.</span>
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}