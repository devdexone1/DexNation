'use client'

import { useState } from 'react'
import Sparkline from '@/components/Sparkline'
import AreaChart from '@/components/AreaChart'
import { formatCash, formatNumber, formatPercent } from '@/lib/format'
import type { NationStatsHistory } from '@/types/database'
import styles from './overview.module.css'

const PERIODS = [
  { label: '7 Day trend', value: 7 },
  { label: '15 Day trend', value: 15 },
  { label: '30 Day trend', value: 30 },
  { label: '1 Year trend', value: 365 },
] as const

function computeGrowthScore(rows: NationStatsHistory[]): number[] {
  if (rows.length === 0) return []
  const gdps = rows.map((r) => r.daily_gdp)
  const pops = rows.map((r) => r.population)
  const gdpMin = Math.min(...gdps)
  const gdpMax = Math.max(...gdps)
  const popMin = Math.min(...pops)
  const popMax = Math.max(...pops)

  return rows.map((r) => {
    const normGdp = gdpMax > gdpMin ? (r.daily_gdp - gdpMin) / (gdpMax - gdpMin) : 0.5
    const normPop = popMax > popMin ? (r.population - popMin) / (popMax - popMin) : 0.5
    const normAr = r.approval_rating / 100
    return ((normGdp + normPop + normAr) / 3) * 100
  })
}

export default function StrategicOverviewPanel({
  cashBalance,
  approvalRating,
  dailyGdp,
  population,
  taxRate,
  politicalStability,
  history,
}: {
  cashBalance: number
  approvalRating: number
  dailyGdp: number
  population: number
  taxRate: number
  politicalStability: number
  history: NationStatsHistory[]
}) {
  // Default 15 days — matches the reference layout. Viewers (including
  // players visiting someone else's profile) can freely change this too;
  // it's a read-only display filter, not something that mutates data.
  const [period, setPeriod] = useState<number>(15)
  const sliced = history.slice(-period)
  const growthScores = computeGrowthScore(sliced)
  const gdpPerCapita = population > 0 ? dailyGdp / population : 0

  return (
    <div className={`${styles.panel} card`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className={styles.panelTitle}>Strategic Overview</h2>
        <select
          className={`select ${styles.periodSelect}`}
          value={period}
          onChange={(e) => setPeriod(Number(e.target.value))}
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.overviewGridTop}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Cash Balance</span>
          <span className={`${styles.statValue} mono`} style={{ color: 'var(--color-positive)' }}>{formatCash(cashBalance)}</span>
          {sliced.length >= 2 ? <Sparkline data={sliced.map((h) => h.cash_balance)} color="var(--color-positive)" /> : null}
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Approval Rating</span>
          <span className={`${styles.statValue} mono`}>{formatPercent(approvalRating)}</span>
          {sliced.length >= 2 ? <Sparkline data={sliced.map((h) => h.approval_rating)} color="var(--color-accent)" /> : null}
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Daily GDP</span>
          <span className={`${styles.statValue} mono`}>{formatCash(dailyGdp)}</span>
          {sliced.length >= 2 ? <Sparkline data={sliced.map((h) => h.daily_gdp)} color="var(--color-positive)" /> : null}
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Population</span>
          <span className={`${styles.statValue} mono`}>{formatNumber(population)}</span>
          {sliced.length >= 2 ? <Sparkline data={sliced.map((h) => h.population)} color="var(--color-ink)" /> : null}
        </div>
      </div>

      <div className={styles.overviewGridBottom}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>GDP / Capita</span>
          <span className={`${styles.statValue} mono`}>${gdpPerCapita.toFixed(2)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Tax Rate</span>
          <span className={`${styles.statValue} mono`}>{formatPercent(taxRate)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Political Stability</span>
          <span className={`${styles.statValue} mono`}>{formatPercent(politicalStability)}</span>
        </div>
        <div className={styles.growthChartCard}>
          <div className={styles.growthChartLabel}>Nation Growth Score</div>
          {growthScores.length >= 2 ? (
            <AreaChart data={growthScores} />
          ) : (
            <div className={styles.emptyState} style={{ fontSize: 11 }}>Not enough history yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}