'use client'

import { useState } from 'react'
import type { AdminInfo } from '@/lib/getAdminInfo'
import type { NationalTrophy, OpenChatReport } from '@/types/database'
import { formatNumber } from '@/lib/format'
import NewsManagementPanel from './NewsManagementPanel'
import NationEditorPanel from './NationEditorPanel'
import PlayerModerationRow from './PlayerModerationRow'
import ChatReportsPanel from './ChatReportsPanel'
import AwardTrophyPanel from './AwardTrophyPanel'
import styles from './admin.module.css'

interface NewsItem {
  id: string
  message: string
  is_active: boolean
  created_at: string
}

interface NationRow {
  id: string
  user_id: string
  name: string
}

const TABS = [
  { id: 'news', label: 'News Management', seniorOnly: true },
  { id: 'nation', label: 'Nation Editor', seniorOnly: true },
  { id: 'moderation', label: 'Player Moderation', seniorOnly: false },
  { id: 'reports', label: 'Chat Reports', seniorOnly: false },
  { id: 'trophies', label: 'Award Trophy', seniorOnly: true },
] as const

type TabId = (typeof TABS)[number]['id']

export default function AdminShell({
  adminInfo,
  isSeniorAdmin,
  stats,
  nations,
  reports,
  trophyDefs,
  newsItems,
}: {
  adminInfo: AdminInfo
  isSeniorAdmin: boolean
  stats: { nations: number; trades: number; wars: number }
  nations: NationRow[]
  reports: OpenChatReport[]
  trophyDefs: NationalTrophy[]
  newsItems: NewsItem[]
}) {
  const visibleTabs = TABS.filter((t) => !t.seniorOnly || isSeniorAdmin)
  const [activeTab, setActiveTab] = useState<TabId>(visibleTabs[0]?.id ?? 'moderation')

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.rankBadge}>
          {adminInfo.rankTitle ?? 'Admin'} · Rank {adminInfo.rank ?? '—'}
        </div>
        <h1 className={styles.title}>Server Administration</h1>
      </div>

      <div className={styles.statGrid}>
        <div className={`${styles.statCard} card`}>
          <div className={styles.statLabel}>Nations</div>
          <div className={styles.statValue}>{formatNumber(stats.nations)}</div>
        </div>
        <div className={`${styles.statCard} card`}>
          <div className={styles.statLabel}>Trades Made</div>
          <div className={styles.statValue}>{formatNumber(stats.trades)}</div>
        </div>
        <div className={`${styles.statCard} card`}>
          <div className={styles.statLabel}>Active Wars</div>
          <div className={styles.statValue}>{formatNumber(stats.wars)}</div>
        </div>
        <div className={`${styles.statCard} card`}>
          <div className={styles.statLabel}>Your Rank</div>
          <div className={styles.statValue}>{adminInfo.rankTitle ?? '—'}</div>
        </div>
      </div>

      <div className={styles.tabBar}>
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${styles.tabBtn}${activeTab === tab.id ? ` ${styles.tabBtnActive}` : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'news' && isSeniorAdmin ? (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>News Management</h2>
          <p className={styles.sectionHint}>
            Add, edit, hide, or delete items shown in the dashboard news ticker. Rank 3+ only.
          </p>
          <NewsManagementPanel items={newsItems} />
        </div>
      ) : null}

      {activeTab === 'nation' && isSeniorAdmin ? (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Nation Editor</h2>
          <p className={styles.sectionHint}>
            Search a nation, then edit its profile or its stats (set a fixed value, or add/subtract a delta). Rank 3+ only.
          </p>
          <NationEditorPanel />
        </div>
      ) : null}

      {activeTab === 'moderation' ? (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Player Moderation ({nations.length} shown)</h2>
          <div className={`${styles.panel} card`}>
            {nations.map((n) => (
              <PlayerModerationRow
                key={n.id}
                userId={n.user_id}
                nationName={n.name}
                canMute={adminInfo.canMute}
                canBan={adminInfo.canBan}
                maxBanDays={adminInfo.maxBanDays}
              />
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === 'reports' ? (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Chat Reports ({reports.length} open)</h2>
          <ChatReportsPanel reports={reports} canMute={adminInfo.canMute} canBan={adminInfo.canBan} />
        </div>
      ) : null}

      {activeTab === 'trophies' && isSeniorAdmin ? (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Award Trophy</h2>
          <AwardTrophyPanel trophyDefs={trophyDefs} />
        </div>
      ) : null}
    </div>
  )
}