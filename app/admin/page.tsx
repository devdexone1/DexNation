import { createClient } from '@/lib/supabase/server'
import { formatNumber } from '@/lib/format'
import AdminStatEditor from './AdminStatEditor'
import ChatReportsPanel from './ChatReportsPanel'
import styles from './admin.module.css'
import PlayerModerationRow from './PlayerModerationRow'

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: myAdmin } = await supabase
    .from('admins')
    .select('rank')
    .eq('user_id', user!.id)
    .maybeSingle()

  const { data: perm } = await supabase
    .from('admin_rank_permissions')
    .select('*')
    .eq('rank', myAdmin?.rank ?? 1)
    .maybeSingle()

  const [nationsCountRes, tradesCountRes, warsCountRes, allNationsRes, reportsRes] = await Promise.all([
    supabase.from('nations').select('id', { count: 'exact', head: true }),
    supabase.from('p2p_trade_history').select('id', { count: 'exact', head: true }),
    supabase.from('active_wars').select('id', { count: 'exact', head: true }).eq('war_status', 'ACTIVE'),
    supabase.from('nations').select('id, user_id, name').order('created_at', { ascending: false }).limit(50),
    supabase.rpc('get_open_chat_reports'),
  ])

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.rankBadge}>{perm?.title ?? 'Admin'}</div>
        <h1 className={styles.title}>Server Administration</h1>
      </div>

      <div className={styles.statGrid}>
        <div className={`${styles.statCard} card`}>
          <div className={styles.statLabel}>Nations</div>
          <div className={styles.statValue}>{formatNumber(nationsCountRes.count ?? 0)}</div>
        </div>
        <div className={`${styles.statCard} card`}>
          <div className={styles.statLabel}>Trades Made</div>
          <div className={styles.statValue}>{formatNumber(tradesCountRes.count ?? 0)}</div>
        </div>
        <div className={`${styles.statCard} card`}>
          <div className={styles.statLabel}>Active Wars</div>
          <div className={styles.statValue}>{formatNumber(warsCountRes.count ?? 0)}</div>
        </div>
        <div className={`${styles.statCard} card`}>
          <div className={styles.statLabel}>Your Rank</div>
          <div className={styles.statValue}>{perm?.title ?? '—'}</div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Players ({allNationsRes.data?.length ?? 0} shown)</h2>
        <div className={`${styles.panel} card`}>
          {(allNationsRes.data ?? []).map((n) => (
            <PlayerModerationRow
              key={n.id}
              userId={n.user_id}
              nationName={n.name}
              canMute={perm?.can_mute ?? false}
              canBan={perm?.can_ban ?? false}
              maxBanDays={perm?.max_ban_days ?? 0}
            />
          ))}
        </div>
      </div>

      {perm?.can_edit_stats ? (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Edit Nation Statistics (Developer/Founder only)</h2>
          <AdminStatEditor />
        </div>
      ) : null}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Chat Reports ({reportsRes.data?.length ?? 0} open)</h2>
        <ChatReportsPanel
          reports={reportsRes.data ?? []}
          canMute={perm?.can_mute ?? false}
          canBan={perm?.can_ban ?? false}
        />
      </div>
    </div>
  )
}