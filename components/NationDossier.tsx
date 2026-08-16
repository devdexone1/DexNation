import Link from 'next/link'
import { formatCash, formatNumber, formatPercent, formatNationAge } from '@/lib/format'
import AchievementBadge from './AchievementBadge'
import FlagDisplay from './FlagDisplay'
import FlagStand from './FlagStand'
import ToolInfo from './ToolInfo'
import Sparkline from './Sparkline'
import styles from './NationDossier.module.css'
import type { Achievement, NationAchievement } from '@/types/database'

export interface NationDossierData {
  name: string
  countryNumber: number
  cashBalance: number
  leaderName: string | null
  ideology: string
  continentId: string
  createdAt: string
  dailyGdp: number
  population: number
  taxRate: number
  politicalStability: number
  approvalRating: number
  creditScore: number | null
  creditGrade: string | null
  allianceLabel: string | null
  activeWarsCount: number
  buildingCount: number
  militaryCount: number
  hasMoraleZero: boolean
  flagUrl: string | null
  flagFrame: string
  history?: {
    cashBalance: number[]
    approvalRating: number[]
    population: number[]
  }
}

export default function NationDossier({
  data,
  achievements,
  unlockedAchievements,
  isOwnNation = false,
}: {
  data: NationDossierData
  achievements: Achievement[]
  unlockedAchievements: NationAchievement[]
  isOwnNation?: boolean
}) {
  const gdpPerCapita = data.population > 0 ? data.dailyGdp / data.population : 0

  const economicHealth = Math.round(data.approvalRating * 0.5 + (data.creditScore ?? 0) * 0.5)
  const infrastructureIndex = Math.min(100, data.buildingCount * 4)
  const militaryReadiness = Math.min(100, Math.round(data.militaryCount * (data.hasMoraleZero ? 0.5 : 1)))

  const unlockedIds = new Set(unlockedAchievements.map((a) => a.achievement_id))
  const unlockedAtById = new Map(unlockedAchievements.map((a) => [a.achievement_id, a.unlocked_at]))

  return (
    <div className={`${styles.card} card`}>
      <div className={styles.header}>
        <div>
          <div className={styles.leaderName}>{data.leaderName ? `Led by ${data.leaderName}` : 'No leader name set'}</div>
          <div className={styles.nationName}>
            {data.name} <span className="mono" style={{ color: 'var(--color-ink-faint)', fontSize: 13 }}>#{data.countryNumber}</span>
          </div>
          <div className={styles.age}>Founded {formatNationAge(data.createdAt)} ago</div>
        </div>
        <div className={styles.badges}>
          <span className="badge badge--neutral">{data.continentId}</span>
          <span className="badge badge--accent">{data.ideology}</span>
        </div>
      </div>

      <div className={styles.flagRow}>
        <FlagStand flagUrl={data.flagUrl} side="left" />
        <FlagDisplay flagUrl={data.flagUrl} frame={data.flagFrame} size="hero" />
        <FlagStand flagUrl={data.flagUrl} side="right" />
        {isOwnNation ? (
          <Link href="/dashboard/profile" className={styles.editFlagLink}>
            Edit Flag &amp; Profile →
          </Link>
        ) : null}
      </div>

      <div className={styles.sectionLabel}>
        Economic Statistics
        <ToolInfo title="What these numbers mean">
          <strong>Cash Balance</strong>: spendable money right now.<br />
          <strong>Daily GDP</strong>: total value your economy produced today (taxed daily).<br />
          <strong>Population</strong>: your citizens — affects RP, upkeep needs, and demand.<br />
          <strong>GDP/Capita</strong>: Daily GDP ÷ Population, an efficiency measure.
        </ToolInfo>
      </div>
      <div className={styles.statGrid}>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Cash Balance</div>
          <div className={`${styles.statValue} mono`}>{formatCash(data.cashBalance)}</div>
          {data.history?.cashBalance ? (
            <div className={styles.sparklineWrap}>
              <Sparkline data={data.history.cashBalance} color="var(--color-positive)" />
            </div>
          ) : null}
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Daily GDP</div>
          <div className={`${styles.statValue} mono`}>{formatCash(data.dailyGdp)}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Population</div>
          <div className={`${styles.statValue} mono`}>{formatNumber(data.population)}</div>
          {data.history?.population ? (
            <div className={styles.sparklineWrap}>
              <Sparkline data={data.history.population} color="var(--color-accent)" />
            </div>
          ) : null}
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>GDP / Capita</div>
          <div className={`${styles.statValue} mono`}>${gdpPerCapita.toFixed(2)}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Tax Rate</div>
          <div className={`${styles.statValue} mono`}>{formatPercent(data.taxRate)}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Political Stability</div>
          <div className={`${styles.statValue} mono`}>{formatPercent(data.politicalStability)}</div>
        </div>
      </div>

      <div className={styles.sectionLabel}>Composite Indices</div>
      <div className={styles.indexGrid}>
        <div className={styles.indexItem}>
          <div className={styles.indexValue}>{economicHealth}</div>
          <div className={styles.indexLabel}>Economic Health<br />(AR + Credit Score)</div>
        </div>
        <div className={styles.indexItem}>
          <div className={styles.indexValue}>{infrastructureIndex}</div>
          <div className={styles.indexLabel}>Infrastructure Index<br />({data.buildingCount} buildings)</div>
        </div>
        <div className={styles.indexItem}>
          <div className={styles.indexValue}>{militaryReadiness}</div>
          <div className={styles.indexLabel}>Military Readiness<br />({formatNumber(data.militaryCount)} units)</div>
        </div>
      </div>

      <div className={styles.sectionLabel}>Geopolitics</div>
      <div>
        <div className={styles.geoRow}>
          <span>Alliance</span>
          <strong>{data.allianceLabel ?? 'No Alliance'}</strong>
        </div>
        <div className={styles.geoRow}>
          <span>Security Status</span>
          <strong>{data.activeWarsCount > 0 ? `At War (${data.activeWarsCount})` : 'At Peace'}</strong>
        </div>
        <div className={styles.geoRow}>
          <span>Credit Grade</span>
          <strong>{data.creditGrade ?? '—'}</strong>
        </div>
      </div>

      <div className={styles.achievementSection}>
        <div className={styles.sectionLabel}>National Honors</div>
        <div className={styles.achievementGrid}>
          {achievements.map((a) => (
            <AchievementBadge key={a.id} achievement={a} unlocked={unlockedIds.has(a.id)} unlockedAt={unlockedAtById.get(a.id)} />
          ))}
        </div>
      </div>
    </div>
  )
}