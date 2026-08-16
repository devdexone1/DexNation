export default function GaugeChart({ value, label, sublabel }: { value: number; label: string; sublabel?: string }) {
  const clamped = Math.max(0, Math.min(100, value))
  const angle = (clamped / 100) * 180
  const radius = 46
  const cx = 60
  const cy = 60

  function polarToCartesian(angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) }
  }

  const start = polarToCartesian(180)
  const end = polarToCartesian(180 - angle)
  const bgEnd = polarToCartesian(0)

  const fgPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`
  const bgPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 1 1 ${bgEnd.x} ${bgEnd.y}`

  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox="0 0 120 66" width="100%" style={{ maxWidth: 130, display: 'block', margin: '0 auto' }}>
        <path d={bgPath} fill="none" stroke="var(--color-surface-sunken)" strokeWidth="10" strokeLinecap="round" />
        <path d={fgPath} fill="none" stroke="var(--color-accent)" strokeWidth="10" strokeLinecap="round" />
        <text x="60" y="52" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--color-ink)">
          {Math.round(clamped)}
        </text>
      </svg>
      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>{label}</div>
      {sublabel ? <div style={{ fontSize: 10, color: 'var(--color-ink-faint)' }}>{sublabel}</div> : null}
    </div>
  )
}