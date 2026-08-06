import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import FlagDisplay from '@/components/FlagDisplay'
import { formatCash, formatPercent } from '@/lib/format'
import styles from './dashboard.module.css'
import type { Nation } from '@/types/database'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let nation: Nation | null = null
  if (user) {
    const { data } = await supabase
      .from('nations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    nation = data
  }

  return (
    <div className={styles.shell}>
      <Sidebar nationName={nation?.name ?? 'Unnamed Nation'} />
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarTitle}>{nation?.name ?? 'Dashboard'}</div>
          <div className={styles.topbarStats}>
            <div className={styles.topbarStat}>
              <span className={styles.topbarStatLabel}>Cash</span>
              <span className={`${styles.topbarStatValue} mono`}>
                {formatCash(nation?.cash_balance)}
              </span>
            </div>
            <div className={styles.topbarStat}>
              <span className={styles.topbarStatLabel}>Approval</span>
              <span className={`${styles.topbarStatValue} mono`}>
                {formatPercent(nation?.approval_rating)}
              </span>
            </div>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}
