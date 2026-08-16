import FlagDisplay from '@/components/FlagDisplay'
import FlagStand from '@/components/FlagStand'
import AchievementBadge from '@/components/AchievementBadge'
import { formatNationAge } from '@/lib/format'
import type { Achievement, NationAchievement } from '@/types/database'
import styles from './overview.module.css'

export default function NationIdentityCard({
  name,
  countryNumber,
  leaderName,
  createdAt,
  flagUrl,
  flagFrame,
  economicHealth,
  infrastructureIndex,
  achievements,
  unlockedAchievements,
}: {
  name: string
  countryNumber: number
  leaderName: string | null
  createdAt: string
  flagUrl: string | null
  flagFrame: string
  economicHealth: number
  infrastructureIndex: number
  achievements: Achievement[]
  unlockedAchievements: NationAchievement[]
}) {
  const unlockedIds = new Set(unlockedAchievements.map((a) => a.achievement_id))
  const unlockedAtById = new Map(unlockedAchievements.map((a) => [a.achievement_id, a.unlocked_at]))

  return (
    <div className={`${styles.identityCard} card`}>
      <div className={styles.identityName}>
        {name} <span className="mono" style={{ fontSize: 13, color: 'var(--color-ink-faint)' }}>#{countryNumber}</span>
      </div>
      <div className={styles.identitySubline}>
        {leaderName ? `(${leaderName} - Leader)` : 'No leader name set'}
      </div>

      <div className={styles.identityFlagWrap} style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 8 }}>
        <FlagStand flagUrl={flagUrl} side="left" />
        <FlagDisplay flagUrl={flagUrl} frame={flagFrame} size="large" />
        <FlagStand flagUrl={flagUrl} side="right" />
      </div>

      <div className={styles.identityMetaRow}>
        <div className={styles.identityMetaLabel}>Leader</div>
        <div className={styles.identityMetaValue}>{leaderName ?? '—'}</div>
      </div>
      <div className={styles.identityMetaRow}>
        <div className={styles.identityMetaLabel}>Founding Date</div>
        <div className={styles.identityMetaValue}>{formatNationAge(createdAt)} ago</div>
      </div>

      <div className={styles.honorBadgeRow}>
        <div className={styles.honorBadge}>
          <div className={styles.honorBadgeIcon}>🏆</div>
          <div className={styles.honorBadgeValue}>{economicHealth}</div>
          <div className={styles.honorBadgeLabel}>Economic Health Rating</div>
        </div>
        <div className={styles.honorBadge}>
          <div className={styles.honorBadgeIcon}>🥈</div>
          <div className={styles.honorBadgeValue}>{infrastructureIndex}</div>
          <div className={styles.honorBadgeLabel}>Infrastructure Index</div>
        </div>
      </div>

      <div className={styles.honorsSectionTitle}>National Honors</div>
      <div className={styles.honorsGrid}>
        {achievements.map((a) => (
          <AchievementBadge
            key={a.id}
            achievement={a}
            unlocked={unlockedIds.has(a.id)}
            unlockedAt={unlockedAtById.get(a.id)}
          />
        ))}
      </div>
    </div>
  )
}