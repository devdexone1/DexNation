'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDebounce } from '@/lib/useDebounce'
import ConfirmButton from '@/components/ConfirmButton'
import type { NationalTrophy } from '@/types/database'
import { awardTrophyAction } from './actions'
import styles from './admin.module.css'

interface NationResult {
  id: string
  name: string
  country_number: number
}

export default function AwardTrophyPanel({ trophyDefs }: { trophyDefs: NationalTrophy[] }) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 1000)
  const [results, setResults] = useState<NationResult[]>([])
  const [selected, setSelected] = useState<NationResult | null>(null)
  const [trophyId, setTrophyId] = useState(trophyDefs[0]?.id ?? '')
  const [note, setNote] = useState('')
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
        .select('id, name, country_number')
        .ilike('name', `%${trimmed}%`)
        .limit(10)
      if (!cancelled) setResults(data ?? [])
    }
    search()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  function handleAward() {
    if (!selected) return
    setStatus('')
    startTransition(async () => {
      const result = await awardTrophyAction(selected.id, trophyId, note)
      setStatus(result.error ?? `Trophy awarded to ${selected.name}.`)
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
              <span>
                {n.name} #{n.country_number}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {selected ? (
        <div style={{ paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Awarding to: {selected.name}</div>

          <div className={styles.formInline} style={{ marginBottom: 10, flexWrap: 'wrap' }}>
            <select className="select" value={trophyId} onChange={(e) => setTrophyId(e.target.value)}>
              {trophyDefs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.icon} {d.title}
                </option>
              ))}
            </select>
            <input
              className="input"
              placeholder="Note (optional, e.g. 'Q1 2026 Economic Cup')"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ maxWidth: 240 }}
            />
          </div>

          <ConfirmButton
            label="Award Trophy"
            confirmLabel="Confirm Award"
            onConfirm={handleAward}
            className="btn btn--primary"
            disabled={isPending}
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