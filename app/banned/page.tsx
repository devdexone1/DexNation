import { createClient } from '@/lib/supabase/server'
import CountdownDisplay from './CountdownDisplay'
import styles from './banned.module.css'

export default async function BannedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let ban: { reason: string | null; banned_until: string } | null = null

  if (user) {
    const { data } = await supabase
      .from('bans')
      .select('reason, banned_until')
      .eq('user_id', user.id)
      .gt('banned_until', new Date().toISOString())
      .order('banned_until', { ascending: false })
      .limit(1)
      .maybeSingle()
    ban = data
  }

  return (
    <div className={styles.wrap}>
      <div className={`${styles.card} card`}>
        <div className={styles.eyebrow}>Access Suspended</div>
        <h1 className={styles.title}>You have been banned</h1>
        {ban?.reason ? <p className={styles.reason}>Reason: {ban.reason}</p> : null}
        {ban ? <CountdownDisplay bannedUntil={ban.banned_until} /> : null}
      </div>
    </div>
  )
}