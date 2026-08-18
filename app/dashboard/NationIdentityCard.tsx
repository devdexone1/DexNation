import FlagDisplay from '@/components/FlagDisplay'
import FlagStand from '@/components/FlagStand'
import AchievementBadge from '@/components/AchievementBadge'
import TrophiesRow from './TrophiesRow'
import { formatNationAge } from '@/lib/format'
import type { Achievement, NationAchievement, NationalTrophy, NationTrophy } from '@/types/database'
import styles from './overview.module.css'

export default function NationIdentityCard({
  name,
  countryNumber,
  leaderName,
  leaderPhotoUrl,
  createdAt,
  flagUrl,
  flagFrame,
  economicHealth,
  infrastructureIndex,
  achievements,
  unlockedAchievements,
  trophies,
  trophyDefs,
}: {
  name: string
  countryNumber: number
  leaderName: string | null
  leaderPhotoUrl?: string | null
  createdAt: string
  flagUrl: string | null
  flagFrame: string
  economicHealth: number
  infrastructureIndex: number
  achievements: Achievement[]
  unlockedAchievements: NationAchievement[]
  trophies: NationTrophy[]
  trophyDefs: NationalTrophy[]
}) {
  const unlockedIds = new Set(unlockedAchievements.map((a) => a.achievement_id))
  const unlockedAtById = new Map(unlockedAchievements.map((a) => [a.achievement_id, a.unlocked_at]))

  // Only show honors the nation actually earned — locked ones are hidden
  // entirely, not shown grayed-out, per explicit design decision.
  const unlockedOnly = achievements.filter((a) => unlockedIds.has(a.id))

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
        <div className={styles.identityMetaValue} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {leaderPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={leaderPhotoUrl} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
          ) : null}
          {leaderName ?? '—'}
        </div>
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

      {unlockedOnly.length > 0 ? (
        <>
          <div className={styles.honorsSectionTitle}>National Honors</div>
          <div className={styles.honorsGrid}>
            {unlockedOnly.map((a) => (
              <AchievementBadge
                key={a.id}
                achievement={a}
                unlocked={true}
                unlockedAt={unlockedAtById.get(a.id)}
              />
            ))}
          </div>
        </>
      ) : null}

      <TrophiesRow trophies={trophies} trophyDefs={trophyDefs} />
    </div>
  )
}