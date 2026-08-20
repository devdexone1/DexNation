import { useId } from 'react'

export default function TrendComparisonChart({
  gdpData,
  approvalData,
  dayLabels,
}: {
  gdpData: number[]
  approvalData: number[]
  dayLabels: string[]
}) {
  const gradientId = useId()

  if (gdpData.length < 2) {
    return <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.5)' }}>Not enough data yet.</div>
  }

  const width = 600
  const height = 90
  const gdpLineGradientId = `trend-gdp-line-${gradientId}`
  const gdpAreaGradientId = `trend-gdp-area-${gradientId}`

  function toPoints(data: number[]) {
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    return data.map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * (height - 10) - 5
      return { x, y }
    })
  }

  const gdpPoints = toPoints(gdpData)
  const approvalPoints = toPoints(approvalData)
  const gdpLine = gdpPoints.map((p) => `${p.x},${p.y}`).join(' ')
  const approvalLine = approvalPoints.map((p) => `${p.x},${p.y}`).join(' ')
  const gdpArea = `0,${height} ${gdpLine} ${width},${height}`

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 10.5, color: 'rgba(255, 255, 255, 0.8)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 2, background: '#60a5fa', display: 'inline-block', borderRadius: 1 }} /> GDP Growth Trend
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 2, background: 'var(--color-accent)', display: 'inline-block', borderRadius: 1 }} /> Approval Trend
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gdpLineGradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id={gdpAreaGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={gdpArea} fill={`url(#${gdpAreaGradientId})`} stroke="none" />
        <polyline points={gdpLine} fill="none" stroke={`url(#${gdpLineGradientId})`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={approvalLine} fill="none" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'rgba(255, 255, 255, 0.45)', marginTop: 4 }}>
        {dayLabels.map((d, i) => <span key={i}>{d}</span>)}
      </div>
    </div>
  )
}