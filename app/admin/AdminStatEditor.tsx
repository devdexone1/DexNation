'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { editNationStatAction } from './actions'
import ConfirmButton from '@/components/ConfirmButton'
import { useDebounce } from '@/lib/useDebounce'
import { formatCash, formatNumber } from '@/lib/format'
import styles from './admin.module.css'

interface NationResult {
  id: string
  name: string
  country_number: number
  cash_balance: number
  population: number
  daily_gdp: number
  research_points: number
}

const EDITABLE_FIELDS = [
  { key: 'cash_balance', label: 'Cash Balance' },
  { key: 'population', label: 'Population' },
  { key: 'daily_gdp', label: 'Daily GDP' },
  { key: 'research_points', label: 'Research Points' },
] as const

export default function AdminStatEditor() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 1000)
  const [results, setResults] = useState<NationResult[]>([])
  const [selected, setSelected] = useState<NationResult | null>(null)
  const [field, setField] = useState<(typeof EDITABLE_FIELDS)[number]['key']>('cash_balance')
  const [newValue, setNewValue] = useState('')
  const [status, setStatus] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    const trimmed = debouncedQuery.trim()
    if (trimmed.length < 2) {
      setResults([])
      return
    }
    async function search() {
      const supabase = createClient()
      const { data } = await supabase
        .from('nations')
        .select('id, name, country_number, cash_balance, population, daily_gdp, research_points')
        .ilike('name', `%${trimmed}%`)
        .limit(10)
      if (!cancelled) setResults(data ?? [])
    }
    search()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  function handleApply() {
    if (!selected) return
    const val = Number(newValue)
    if (!Number.isFinite(val) || val < 0) {
      setStatus('Enter a valid non-negative number.')
      return
    }
    startTransition(async () => {
      const result = await editNationStatAction(selected.id, field, val)
      setStatus(result.error ?? `Updated ${field} to ${val}.`)
      if (!result.error) {
        setSelected({ ...selected, [field]: val })
      }
    })
  }

  return (
    <div className={`${styles.panel} card`}>
      <input
        className="input"
        placeholder="Search nation by name…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setSelected(null)
        }}
        style={{ marginBottom: 10 }}
      />

      {results.length > 0 && !selected ? (
        <div style={{ marginBottom: 10 }}>
          {results.map((n) => (
            <div key={n.id} className={styles.playerRow} style={{ cursor: 'pointer' }} onClick={() => setSelected(n)}>
              <span>{n.name} #{n.country_number}</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--color-ink-faint)' }}>{formatCash(n.cash_balance)}</span>
            </div>
          ))}
        </div>
      ) : null}

      {selected ? (
        <div style={{ padding: '12px 0', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
            Editing: {selected.name} #{selected.country_number}
          </div>

          <div className={styles.formInline} style={{ marginBottom: 10, flexWrap: 'wrap' }}>
            <select className="select" value={field} onChange={(e) => setField(e.target.value as typeof field)}>
              {EDITABLE_FIELDS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label} (current: {formatNumber(selected[f.key])})
                </option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              min={0}
              placeholder="New value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              style={{ maxWidth: 160 }}
            />
          </div>

          <ConfirmButton
            label="Apply Change"
            confirmLabel="Confirm — This Changes Real Game Data"
            onConfirm={handleApply}
            className="btn btn--primary"
            disabled={isPending || !newValue}
          />

          {status ? <div style={{ fontSize: 12, marginTop: 8 }}>{status}</div> : null}

          <button type="button" className="btn btn--outline" style={{ marginLeft: 8 }} onClick={() => setSelected(null)}>
            Change Nation
          </button>
        </div>
      ) : null}
    </div>
  )
}