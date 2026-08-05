'use client'

import { useState, useTransition } from 'react'
import { proposeResolutionAction, castResolutionVoteAction } from './actions'
import type { GlobalResolution } from '@/types/database'
import styles from './politics.module.css'

interface NationOption {
  id: string
  name: string
}

export default function UnResolutions({
  nationId,
  resolutions,
  votedResolutionIds,
  nationOptions,
}: {
  nationId: string
  resolutions: GlobalResolution[]
  votedResolutionIds: Set<string>
  nationOptions: NationOption[]
}) {
  const [resType, setResType] = useState('EMBARGO')
  const [targetId, setTargetId] = useState(nationOptions[0]?.id ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handlePropose(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await proposeResolutionAction(
        nationId,
        resType,
        resType === 'INTEREST_RATE_CAP' ? null : targetId
      )
      if (result.error) {
        setError(result.error)
        return
      }
      window.location.reload()
    })
  }

  function handleVote(resolutionId: string, choice: 'FOR' | 'AGAINST') {
    setError('')
    startTransition(async () => {
      const result = await castResolutionVoteAction(nationId, resolutionId, choice)
      if (result.error) {
        setError(result.error)
        return
      }
      window.location.reload()
    })
  }

  return (
    <div>
      <div className={`${styles.resolutionCard} card`} style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14 }}>Propose a Resolution</h3>
        <form className={styles.proposeForm} onSubmit={handlePropose}>
          <select className="select" value={resType} onChange={(e) => setResType(e.target.value)}>
            <option value="EMBARGO">Embargo (block a nation from trading)</option>
            <option value="INTEREST_RATE_CAP">Interest Rate Cap (3% max loan interest)</option>
            <option value="PEACE_ENFORCEMENT">Peace Enforcement (force a nation into peace)</option>
          </select>

          {resType !== 'INTEREST_RATE_CAP' && (
            <select className="select" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
              {nationOptions.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          )}

          {error ? <div className={styles.resolutionMeta} style={{ color: 'var(--color-negative)' }}>{error}</div> : null}

          <button type="submit" className="btn btn--primary" disabled={isPending}>
            {isPending ? 'Proposing…' : 'Propose (3-tick vote)'}
          </button>
        </form>
      </div>

      {resolutions.length === 0 ? (
        <div className={styles.resolutionMeta}>No active resolutions up for vote.</div>
      ) : (
        resolutions.map((r) => {
          const total = r.votes_for + r.votes_against;
          const pct = total > 0 ? (r.votes_for / total) * 100 : 0;
          const hasVoted = votedResolutionIds.has(r.id);
          return (
            <div className={`${styles.resolutionCard} card`} key={r.id} style={{ marginBottom: 10 }}>
              <div className={styles.resolutionHeader}>
                <span className={styles.resolutionType}>{r.resolution_type.replace(/_/g, ' ')}</span>
                <span className="badge badge--accent">ends tick #{r.end_tick}</span>
              </div>
              <div className={styles.voteBarWrap}>
                <div className={styles.voteBarFor} style={{ width: `${pct}%` }} />
              </div>
              <div className={styles.voteStats}>
                <span>For: {r.votes_for.toFixed(1)}</span>
                <span>{pct.toFixed(0)}% approval (need &gt;66%)</span>
                <span>Against: {r.votes_against.toFixed(1)}</span>
              </div>
              {!hasVoted ? (
                <div className={styles.voteActions}>
                  <button
                    type="button"
                    className="btn btn--primary"
                    style={{ padding: '8px 14px', fontSize: 12.5 }}
                    onClick={() => handleVote(r.id, 'FOR')}
                    disabled={isPending}
                  >
                    Vote For
                  </button>
                  <button
                    type="button"
                    className="btn btn--outline"
                    style={{ padding: '8px 14px', fontSize: 12.5 }}
                    onClick={() => handleVote(r.id, 'AGAINST')}
                    disabled={isPending}
                  >
                    Vote Against
                  </button>
                </div>
              ) : (
                <span className="badge badge--neutral" style={{ width: 'fit-content' }}>
                  You voted
                </span>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}