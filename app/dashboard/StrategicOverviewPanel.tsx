'use client'

import { useState } from 'react'
import Sparkline from '@/components/Sparkline'
import TrendComparisonChart from '@/components/TrendComparisonChart'
import { formatCash, formatNumber, formatPercent, getTrendColor } from '@/lib/format'
import type { NationStatsHistory } from '@/types/database'
import styles from './overview.module.css'

const PERIODS = [
  { label: '7 Day trend', value: 7 },
  { label: '15 Day trend', value: 15 },
  { label: '30 Day trend', value: 30 },
  { label: '1 Year trend', value: 365 },
] as const

// Picks ~6 evenly spaced day labels out of the sliced history window,
// instead of one label per data point (matches the reference chart).
function pickDayLabels(rows: NationStatsHistory[], count = 6): string[] {
  if (rows.length === 0) return []
  if (rows.length <= count) {
    return rows.map((r) => new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  }
  const step = (rows.length - 1) / (count - 1)
  const labels: string[] = []
  for (let i = 0; i < count; i++) {
    const idx = Math.round(i * step)
    labels.push(new Date(rows[idx].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  }
  return labels
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

  const cashSeries = sliced.map((h) => h.cash_balance)
  const approvalSeries = sliced.map((h) => h.approval_rating)
  const gdpSeries = sliced.map((h) => h.daily_gdp)
  const populationSeries = sliced.map((h) => h.population)
  const gdpPerCapitaSeries = sliced.map((h) => (h.population > 0 ? h.daily_gdp / h.population : 0))
  const taxRateSeries = sliced
    .map((h) => h.tax_rate)
    .filter((v): v is number => v !== null && v !== undefined)
  const politicalStabilitySeries = sliced
    .map((h) => h.political_stability)
    .filter((v): v is number => v !== null && v !== undefined)

  const gdpGrowthSeries = (() => {
    if (gdpSeries.length === 0) return []
    const first = gdpSeries[0]
    if (first === 0) return gdpSeries.map(() => 0)
    return gdpSeries.map((v) => ((v - first) / Math.abs(first)) * 100)
  })()

  const gdpPerCapita = population > 0 ? dailyGdp / population : 0
  const dayLabels = pickDayLabels(sliced)

  return (
    <div className={styles.strategicPanel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className={styles.strategicTitle}>Strategic Overview</h2>
        <select
          className={styles.strategicPeriodSelect}
          value={period}
          onChange={(e) => setPeriod(Number(e.target.value))}
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.strategicGrid}>
        <div className={styles.strategicCell}>
          <span className={styles.strategicCellLabel}>Cash Balance</span>
                    <span className={`${styles.strategicCellValue} ${styles['strategicCellValue--positive']} mono`}>{formatCash(cashBalance)}</span>
          {cashSeries.length >= 2 ? <Sparkline data={cashSeries} color={getTrendColor(cashSeries)} /> : null}
        </div>
        <div className={styles.strategicCell}>
          <span className={styles.strategicCellLabel}>Approval Rating</span>
          <span className={`${styles.strategicCellValue} mono`}>{formatPercent(approvalRating)}</span>
          {approvalSeries.length >= 2 ? <Sparkline data={approvalSeries} color={getTrendColor(approvalSeries)} /> : null}
        </div>
        <div className={styles.strategicCell}>
          <span className={styles.strategicCellLabel}>Daily GDP</span>
          <span className={`${styles.strategicCellValue} mono`}>{formatCash(dailyGdp)}</span>
          {gdpSeries.length >= 2 ? <Sparkline data={gdpSeries} color={getTrendColor(gdpSeries)} /> : null}
        </div>
        <div className={styles.strategicCell}>
          <span className={styles.strategicCellLabel}>Population</span>
          <span className={`${styles.strategicCellValue} mono`}>{formatNumber(population)}</span>
          {populationSeries.length >= 2 ? <Sparkline data={populationSeries} color={getTrendColor(populationSeries)} /> : null}
        </div>

        <div className={styles.strategicChartCell}>
          <TrendComparisonChart gdpData={gdpGrowthSeries} approvalData={approvalSeries} dayLabels={dayLabels} />
        </div>

        <div className={styles.strategicCell}>
          <span className={styles.strategicCellLabel}>GDP / Capita</span>
          <span className={`${styles.strategicCellValue} mono`}>${gdpPerCapita.toFixed(2)}</span>
          {gdpPerCapitaSeries.length >= 2 ? <Sparkline data={gdpPerCapitaSeries} color={getTrendColor(gdpPerCapitaSeries)} /> : null}
        </div>
        <div className={styles.strategicCell}>
          <span className={styles.strategicCellLabel}>Tax Rate</span>
          <span className={`${styles.strategicCellValue} mono`}>{formatPercent(taxRate)}</span>
          {taxRateSeries.length >= 2 ? <Sparkline data={taxRateSeries} color={getTrendColor(taxRateSeries)} /> : null}
        </div>
        <div className={styles.strategicCell}>
          <span className={styles.strategicCellLabel}>Political Stability</span>
          <span className={`${styles.strategicCellValue} mono`}>{formatPercent(politicalStability)}</span>
          {politicalStabilitySeries.length >= 2 ? (
            <Sparkline data={politicalStabilitySeries} color={getTrendColor(politicalStabilitySeries)} />
          ) : null}
        </div>
      </div>
    </div>
  )
}