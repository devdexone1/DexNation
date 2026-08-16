export default function Sparkline({
  data,
  color = 'var(--color-positive)',
}: {
  data: number[]
  color?: string
}) {
  if (data.length < 2) return null

  const width = 100
  const height = 26
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}