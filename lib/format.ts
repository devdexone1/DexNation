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
