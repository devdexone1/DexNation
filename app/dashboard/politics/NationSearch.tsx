'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useDebounce } from '@/lib/useDebounce'
import styles from './politics.module.css'

interface NationResult {
  id: string
  name: string
  continent_id: string
}

export default function NationSearch() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 2000)
  const [results, setResults] = useState<NationResult[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    let cancelled = false
    const trimmed = debouncedQuery.trim()

    if (trimmed.length < 2) {
      setResults([])
      return
    }

    async function search() {
      setSearching(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('nations')
        .select('id, name, continent_id')
        .ilike('name', `%${trimmed}%`)
        .limit(10)

      if (!cancelled) {
        setResults(data ?? [])
        setSearching(false)
      }
    }

    search()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  return (
    <div className={`${styles.allianceCard} card`}>
      <h3 style={{ fontSize: 14, marginBottom: 10 }}>Find a Nation</h3>
      <input
        className="input"
        type="text"
        placeholder="Type a name… (searches automatically)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query.length >= 1 && query.length < 2 ? (
        <div className={styles.notifMeta} style={{ marginTop: 6 }}>Type at least 2 characters.</div>
      ) : null}
      {searching ? <div className={styles.notifMeta} style={{ marginTop: 6 }}>Searching…</div> : null}

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