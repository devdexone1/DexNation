export default function TrendComparisonChart({
  gdpData,
  approvalData,
  dayLabels,
}: {
  gdpData: number[]
  approvalData: number[]
  dayLabels: string[]
}) {
  if (gdpData.length < 2) return <div style={{ fontSize: 11, color: 'var(--color-ink-faint)' }}>Not enough data yet.</div>

  const width = 600
  const height = 90

  function toPoints(data: number[]) {
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    return data.map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * (height - 10) - 5
      return `${x},${y}`
    }).join(' ')
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 10.5 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 2, background: '#3b82f6', display: 'inline-block' }} /> GDP Growth Trend
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 2, background: 'var(--color-accent)', display: 'inline-block' }} /> Approval Trend
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
        <polyline points={toPoints(gdpData)} fill="none" stroke="#3b82f6" strokeWidth="1.8" />
        <polyline points={toPoints(approvalData)} fill="none" stroke="var(--color-accent)" strokeWidth="1.8" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--color-ink-faint)', marginTop: 4 }}>
        {dayLabels.map((d, i) => <span key={i}>{d}</span>)}
      </div>
    </div>
  )
}