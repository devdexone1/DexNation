'use client'

import { useState, useTransition } from 'react'
import { reformIdeologyAction } from './actions'
import { formatCash } from '@/lib/format'
import styles from './politics.module.css'

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

export default function IdeologyPanel({
  nationId,
  currentIdeology,
  cashBalance,
  lastChangeAt,
}: {
  nationId: string
  currentIdeology: string
  cashBalance: number
  lastChangeAt: string | null
}) {
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const reformCost = Math.floor(cashBalance * 0.1)

  function handleReform(newIdeology: string) {
    setError('')
    startTransition(async () => {
      const result = await reformIdeologyAction(nationId, newIdeology)
      if (result.error) {
        setError(result.error)
        return
      }
      window.location.reload()
    })
  }

  return (
    <div>
      <div className={`${styles.currentGov} card`}>
        <div>
          <div className={styles.currentGovLabel}>Current Ideology</div>
          <div className={styles.currentGovValue}>{currentIdeology}</div>
          {lastChangeAt ? (
            <div className={styles.reformCost} style={{ color: 'var(--color-ink-faint)', marginTop: 4 }}>
              Last changed: {new Date(lastChangeAt).toLocaleString()}
            </div>
          ) : null}
        </div>
        <span className="badge badge--accent">{currentIdeology}</span>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.ideologyGrid}>
        {IDEOLOGIES.map((opt) => {
          const isCurrent = opt.id === currentIdeology
          return (
            <button
              type="button"
              key={opt.id}
              disabled={isCurrent || isPending}
              onClick={() => handleReform(opt.id)}
              className={`${styles.ideologyCard} ${isCurrent ? styles.ideologyCardCurrent : ''}`}
            >
              <span className={styles.ideologyName}>
                {opt.name} {isCurrent ? <span className="badge badge--positive">Current</span> : null}
              </span>
              <span className={styles.ideologyDesc}>{opt.desc}</span>
              {!isCurrent && (
                <span className={styles.reformCost}>
                  Reform cost: {formatCash(reformCost)} · AR -15%
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}