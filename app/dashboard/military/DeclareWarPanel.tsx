'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { declareWarAction } from './actions'
import styles from './military.module.css'

interface NationResult {
  id: string
  name: string
  continent_id: string
}

export default function DeclareWarPanel({ nationId }: { nationId: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NationResult[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleSearch() {
    if (query.trim().length < 2) return
    setSearching(true)
    setError('')
    const supabase = createClient()
    const { data, error: searchError } = await supabase
      .from('nations')
      .select('id, name, continent_id')
      .ilike('name', `%${query.trim()}%`)
      .neq('id', nationId)
      .limit(5)

    if (searchError) {
      setError(searchError.message)
    } else {
      setResults(data ?? [])
    }
    setSearching(false)
  }

  function handleDeclare(defenderId: string) {
    setError('')
    setSuccess('')
    startTransition(async () => {
      const result = await declareWarAction(nationId, defenderId)
      if (result.error) {
        setError(result.error)
        return
      }
      setSuccess('War declared. Refreshing…')
      setTimeout(() => window.location.reload(), 800)
    })
  }

  return (
    <div className={`${styles.declarePanel} card`}>
      <div className={styles.searchRow}>
        <input
          className={`input ${styles.searchInput}`}
          type="text"
          placeholder="Search nation by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button type="button" className="btn btn--outline" onClick={handleSearch} disabled={searching}>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </div>

      {error ? <div className={styles.declareError}>{error}</div> : null}
      {success ? <div className={styles.declareSuccess}>{success}</div> : null}

      {results.length > 0 && (
        <div className={styles.resultsList}>
          {results.map((n) => (
            <div className={styles.resultRow} key={n.id}>
              <span>
                {n.name} <span className="badge badge--neutral">{n.continent_id}</span>
              </span>
              <button
                type="button"
                className="btn btn--primary"
                style={{ padding: '8px 14px', fontSize: 12.5 }}
                disabled={isPending}
                onClick={() => handleDeclare(n.id)}
              >
                Declare War
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}