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