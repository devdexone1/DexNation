const numberFormatter = new Intl.NumberFormat('en-US')

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  return numberFormatter.format(value)
}

export function formatCash(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  return `$${numberFormatter.format(value)}`
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  return `${Number(value).toFixed(2)}%`
}

export function formatNationAge(createdAt: string) {
  const start = new Date(createdAt)
  const now = new Date()

  let years = now.getFullYear() - start.getFullYear()
  let months = now.getMonth() - start.getMonth()
  let days = now.getDate() - start.getDate()

  if (days < 0) {
    months -= 1
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  const parts: string[] = []
  if (years > 0) parts.push(`${years} year${years === 1 ? '' : 's'}`)
  if (months > 0) parts.push(`${months} month${months === 1 ? '' : 's'}`)
  if (parts.length < 2) parts.push(`${days} day${days === 1 ? '' : 's'}`)

  return parts.join(', ') || 'Founded today'
}

export function formatNationId(countryNumber: number | null | undefined) {
  if (countryNumber === null || countryNumber === undefined) return ''
  return `#${countryNumber}`
}

// Trend color for tick-over-tick charts (Strategic Overview mini charts):
// blue = flat or change under 3%, green = significant increase, red = significant decrease.
export function getTrendColor(data: number[]): string {
  if (data.length < 2) return 'var(--color-info)'
  const prev = data[data.length - 2]
  const last = data[data.length - 1]
  if (prev === 0) {
    if (last === 0) return 'var(--color-info)'
    return last > 0 ? 'var(--color-positive)' : 'var(--color-negative)'
  }
  const pctChange = ((last - prev) / Math.abs(prev)) * 100
  if (Math.abs(pctChange) < 3) return 'var(--color-info)'
  return pctChange > 0 ? 'var(--color-positive)' : 'var(--color-negative)'
}