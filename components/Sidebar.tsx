'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import TickClock from './TickClock'
import styles from './Sidebar.module.css'

const icons: Record<string, React.ReactNode> = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </svg>
  ),
  economy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 20V10M11 20V4M18 20v-7" strokeLinecap="round" />
    </svg>
  ),
  military: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" strokeLinejoin="round" />
    </svg>
  ),
  politics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M5 4v16M5 4h9l-1.5 3L14 10H5" strokeLinejoin="round" />
    </svg>
  ),
  research: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path
        d="M9 3h6M10 3v5.5L5.5 17a1.7 1.7 0 0 0 1.5 2.5h10a1.7 1.7 0 0 0 1.5-2.5L14 8.5V3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  bank: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path
        d="M3 10l9-6 9 6M4.5 10v9M9.5 10v9M14.5 10v9M19.5 10v9M2.5 19.5h19"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  market: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path
        d="M4 7h16M4 7l2 10a2 2 0 0 0 2 1.7h8a2 2 0 0 0 2-1.7L20 7M9 11v4M15 11v4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8" r="3.3" />
      <path d="M5 20c1.2-3.8 4-5.7 7-5.7s5.8 1.9 7 5.7" strokeLinecap="round" />
    </svg>
  ),
  signout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path
        d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M15 16l4-4-4-4M19 12H9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', exact: true, ready: true },
  { to: '/dashboard/guide', label: 'Guide', icon: 'research', ready: true },
  { to: '/dashboard/economy', label: 'Economy', icon: 'economy', ready: true },
  { to: '/dashboard/military', label: 'Military', icon: 'military', ready: true },
  { to: '/dashboard/politics', label: 'Politics', icon: 'politics', ready: true },
  { to: '/dashboard/research', label: 'Research', icon: 'research', ready: true },
  { to: '/dashboard/bank', label: 'World Bank', icon: 'bank', ready: true },
  { to: '/dashboard/market', label: 'Market', icon: 'market', ready: true },
  { to: '/dashboard/leaderboard', label: 'Leaderboard', icon: 'profile', ready: true },
  { to: '/dashboard/statistics', label: 'Statistics', icon: 'research', ready: true },
  { to: '/dashboard/inventory', label: 'Inventory', icon: 'economy', ready: true },
  { to: '/dashboard/profile', label: 'Profile', icon: 'profile', ready: true },
]

export default function Sidebar({ nationName, isAdmin }: { nationName: string; isAdmin?: boolean }) {
  const pathname = usePathname()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className={styles.sidebar}>
      <div>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            Dex<span>Nation</span>
          </span>
        </div>
        <div className={styles.nationName}>{nationName}</div>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.to : pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              href={item.to}
              className={`${styles.link}${isActive ? ` ${styles.linkActive}` : ''}`}
            >
              <span className={styles.linkIcon}>{icons[item.icon]}</span>
              {item.label}
              {!item.ready && <span className={styles.linkSoon}>SOON</span>}
            </Link>
          )
        })}
      {isAdmin ? (
          <a href="/admin" className={styles.link}>
            <span className={styles.linkIcon}>{icons.politics}</span>
            Admin Panel
          </a>
        ) : null}
      </nav>

      <div className={styles.footer}>
        <TickClock />
        <button type="button" className={styles.signOut} onClick={handleSignOut}>
          <span className={styles.linkIcon}>{icons.signout}</span>
          Sign out
        </button>
      </div>
    </aside>
  )
}
