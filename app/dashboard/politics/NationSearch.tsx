'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import styles from './politics.module.css'

interface NationResult {
  id: string
  name: string
  continent_id: string
}

export default function NationSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NationResult[]>([])
  const [searching, setSearching] = useState(false)

  async function handleSearch() {
    if (query.trim().length < 2) return
    setSearching(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('nations')
      .select('id, name, continent_id')
      .ilike('name', `%${query.trim()}%`)
      .limit(10)
    setResults(data ?? [])
    setSearching(false)
  }

  return (
    <div className={`${styles.allianceCard} card`}>
      <h3 style={{ fontSize: 14, marginBottom: 10 }}>Find a Nation</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          className="input"
          type="text"
          placeholder="Search by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button type="button" className="btn btn--outline" onClick={handleSearch} disabled={searching}>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </div>

      {results.map((n) => (
        <div className={styles.browseRow} key={n.id}>
          <Link href={`/dashboard/nations/${n.id}`} style={{ textDecoration: 'underline', color: 'inherit' }}>
            {n.name}
          </Link>
          <span className="badge badge--neutral">{n.continent_id}</span>
        </div>
      ))}
    </div>
  )
}