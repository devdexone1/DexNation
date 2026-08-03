'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { pickFairContinentClient } from '@/lib/continent-client'
import styles from './create-nation.module.css'

// Per File 04 §2.1 — Ideology Modifiers Matrix
const IDEOLOGIES = [
  {
    id: 'DEMOCRACY',
    name: 'Democracy',
    desc: 'Base AR +10%, Tax Efficiency 85%, Consumer Goods Output +15%, Military Upkeep +10%.',
  },
  {
    id: 'AUTOCRACY',
    name: 'Autocracy',
    desc: 'Base AR -10%, Tax Efficiency 110%, Military Upkeep -15%, Build Time -20%.',
  },
  {
    id: 'TECHNOCRACY',
    name: 'Technocracy',
    desc: 'Research Generation +25%, High-Tech Output +15%, Raw Extraction -10%.',
  },
  {
    id: 'COMMUNISM',
    name: 'Communism',
    desc: 'Consumer Goods Demand -15%, AR floor locked at 40%, High-Tech Output -10%.',
  },
  {
    id: 'CAPITALIST_FREE_MARKET',
    name: 'Capitalist Free-Market',
    desc: 'Import Customs Duty -50%, P2P GDP Revenue +20%, AR deficit penalty is 1.5x sharper.',
  },
] as const

export default function CreateNationForm({ userEmail }: { userEmail: string | null }) {
  const [name, setName] = useState('')
  const [ideology, setIdeology] = useState('DEMOCRACY')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const trimmedName = name.trim()
    if (trimmedName.length < 3) {
      setError('Nation name must be at least 3 characters long.')
      return
    }
    if (trimmedName.length > 40) {
      setError('Nation name must be at most 40 characters long.')
      return
    }

    startTransition(async () => {
      try {
        const supabase = createClient()
        const continentId = await pickFairContinentClient()

        const { error: rpcError } = await supabase.rpc('create_nation', {
          nation_name: trimmedName,
          chosen_ideology: ideology,
          chosen_continent_id: continentId,
        })

        if (rpcError) {
          setError(rpcError.message)
          return
        }

        // Direct client-side call + hard navigation — no Server Action involved.
        window.location.href = '/dashboard'
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      }
    })
  }

  return (
    <div className={styles.wrap}>
      <div className={`${styles.card} card`}>
        <div>
          <div className={styles.eyebrow}>Final Step</div>
          <h1 className={styles.title}>Found your nation</h1>
          <p className={styles.subtitle}>
            Signed in as <strong>{userEmail ?? 'new player'}</strong>. Choose a name and
            an ideology — everything else (starting warehouse, starter buildings) is set
            up automatically.{' '}
            <button type="button" onClick={handleSignOut} className={styles.signOutLink}>
              Not you?
            </button>
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className="field">
            <label className="field__label" htmlFor="nation-name">
              Nation Name
            </label>
            <input
              id="nation-name"
              className="input"
              type="text"
              placeholder="e.g. Republic of Aurelia"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              required
            />
          </div>

          <div className="field">
            <span className="field__label">Ideology</span>
            <div className={styles.ideologyGrid}>
              {IDEOLOGIES.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setIdeology(opt.id)}
                  className={
                    styles.ideologyOption +
                    (ideology === opt.id ? ` ${styles.ideologyOptionSelected}` : '')
                  }
                >
                  <span className={styles.ideologyName}>
                    {opt.name}
                    {ideology === opt.id ? (
                      <span className="badge badge--accent">Selected</span>
                    ) : null}
                  </span>
                  <span className={styles.ideologyDesc}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.continentNote}>
            <span className={styles.continentDot} />
            Your continent will be assigned automatically, randomly and fairly (filling
            the continent with the fewest nations) once you submit.
          </div>

          {error ? <div className={styles.error}>{error}</div> : null}

          <button type="submit" className="btn btn--primary btn--full" disabled={isPending}>
            {isPending ? 'Founding your nation…' : 'Found Nation'}
          </button>
        </form>
      </div>
    </div>
  )
}