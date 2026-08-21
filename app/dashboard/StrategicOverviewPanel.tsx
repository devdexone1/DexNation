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
// Picks ~6 evenly spaced day labels out of the sliced history window,
// instead of one label per data point (matches the reference chart).
//
// Deliberately does NOT use each row's `created_at` (the real wall-clock
// timestamp of when the snapshot was inserted) — during testing, many
// in-game "days" can get recorded on the same real calendar day, which
// made every label show the same date (e.g. "Aug 19" repeated). Instead
// this derives a calendar date from the nation's founding date + the
// in-game day number (`recorded_tick`), which advances one real day per
// in-game day and rolls over months/years correctly on its own (native
// Date arithmetic already handles "end of month" / "into next month"
// without any special-casing).
function pickDayLabels(rows: NationStatsHistory[], foundingDate: string, count = 6): string[] {
  if (rows.length === 0) return []
  const founding = new Date(foundingDate)

  function labelForTick(tick: number) {
    const d = new Date(founding)
    d.setDate(founding.getDate() + Math.max(0, tick - 1))
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (rows.length <= count) {
    return rows.map((r) => labelForTick(r.recorded_tick))
  }
  const step = (rows.length - 1) / (count - 1)
  const labels: string[] = []
  for (let i = 0; i < count; i++) {
    const idx = Math.round(i * step)
    labels.push(labelForTick(rows[idx].recorded_tick))
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
  foundingDate,
}: {
  cashBalance: number
  approvalRating: number
  dailyGdp: number
  population: number
  taxRate: number
  politicalStability: number
  history: NationStatsHistory[]
  foundingDate: string
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
  const dayLabels = pickDayLabels(sliced, foundingDate)

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