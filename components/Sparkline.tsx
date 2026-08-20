import { useId } from 'react'

export default function Sparkline({
  data,
  color = 'var(--color-positive)',
}: {
  data: number[]
  color?: string
}) {
  const gradientId = useId()

  if (data.length < 2) return null

  const width = 100
  const height = 26
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return { x, y }
  })

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ')
  const areaPoints = `0,${height} ${linePoints} ${width},${height}`
  const lineGradientId = `spark-line-${gradientId}`
  const areaGradientId = `spark-area-${gradientId}`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={lineGradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${areaGradientId})`} stroke="none" />
      <polyline
        points={linePoints}
        fill="none"
        stroke={`url(#${lineGradientId})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}