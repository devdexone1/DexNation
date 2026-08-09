'use client'

import { useState } from 'react'
import type { Achievement } from '@/types/database'
import styles from './NationDossier.module.css'

export default function AchievementBadge({
  achievement,
  unlocked,
  unlockedAt,
}: {
  achievement: Achievement
  unlocked: boolean
  unlockedAt?: string
}) {
  const [hover, setHover] = useState(false)

  return (
    <div
      className={styles.badgeWrap}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className={`${styles.badgeIcon} ${unlocked ? styles.badgeUnlocked : styles.badgeLocked}`}>
        {achievement.icon}
      </div>
      {hover ? (
        <div className={styles.tooltip}>
          <div className={styles.tooltipTitle}>{achievement.title}</div>
          {achievement.description}
          <div className={styles.tooltipStatus}>
            {unlocked
              ? `Unlocked ${unlockedAt ? new Date(unlockedAt).toLocaleDateString() : ''}`
              : 'Locked'}
          </div>
        </div>
      ) : null}
    </div>
  )
}