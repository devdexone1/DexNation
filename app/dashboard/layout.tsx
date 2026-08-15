import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import ChatWidget from '@/components/chat/ChatWidget'
import FlagDisplay from '@/components/FlagDisplay'
import { formatCash, formatPercent } from '@/lib/format'
import styles from './dashboard.module.css'
import type { Nation } from '@/types/database'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { getAdminInfo } from '@/lib/getAdminInfo'

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

  // Centralized helper — see lib/getAdminInfo.ts
  const adminInfo = await getAdminInfo(user?.id)

  return (
    <div className={styles.shell}>
      <Sidebar nationName={nation?.name ?? 'Unnamed Nation'} countryNumber={nation?.country_number} isAdmin={adminInfo?.isAdmin ?? false} />
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
      <ChatWidget myContinentId={nation?.continent_id ?? null} adminInfo={adminInfo} currentUserId={user?.id ?? null} />
    </div>
  )
}
