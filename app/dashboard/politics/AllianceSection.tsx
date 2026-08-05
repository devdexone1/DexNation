'use client'

import { useState, useTransition } from 'react'
import { createAllianceAction, joinAllianceAction, leaveAllianceAction } from './actions'
import { formatCash } from '@/lib/format'
import type { Alliance, AllianceMember } from '@/types/database'
import styles from './politics.module.css'

interface BrowsableAlliance extends Alliance {
  memberCount: number
}

export default function AllianceSection({
  nationId,
  membership,
  currentAlliance,
  members,
  memberNames,
  browsableAlliances,
}: {
  nationId: string
  membership: AllianceMember | null
  currentAlliance: Alliance | null
  members: AllianceMember[]
  memberNames: Record<string, string>
  browsableAlliances: BrowsableAlliance[]
}) {
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (name.trim().length < 3) {
      setError('Alliance name must be at least 3 characters.')
      return
    }
    if (tag.trim().length < 1 || tag.trim().length > 4) {
      setError('Alliance tag must be 1-4 characters.')
      return
    }
    startTransition(async () => {
      const result = await createAllianceAction(nationId, name.trim(), tag.trim())
      if (result.error) {
        setError(result.error)
        return
      }
      window.location.reload()
    })
  }

  function handleJoin(allianceId: string) {
    setError('')
    startTransition(async () => {
      const result = await joinAllianceAction(nationId, allianceId)
      if (result.error) {
        setError(result.error)
        return
      }
      window.location.reload()
    })
  }

  function handleLeave() {
    setError('')
    startTransition(async () => {
      const result = await leaveAllianceAction(nationId)
      if (result.error) {
        setError(result.error)
        return
      }
      window.location.reload()
    })
  }

  if (membership && currentAlliance) {
    return (
      <div className={`${styles.allianceCard} card`}>
        <div className={styles.allianceHeader}>
          <div>
            <div className={styles.allianceName}>
              {currentAlliance.name} <span className={styles.allianceTag}>[{currentAlliance.tag}]</span>
            </div>
          </div>
          <span className="badge badge--accent">{membership.role}</span>
        </div>

        <div className={styles.allianceStatsRow}>
          <div className={styles.allianceStat}>
            <span className={styles.allianceStatLabel}>Treasury</span>
            <span className={`${styles.allianceStatValue} mono`}>
              {formatCash(currentAlliance.treasury_cash)}
            </span>
          </div>
          <div className={styles.allianceStat}>
            <span className={styles.allianceStatLabel}>Members</span>
            <span className={`${styles.allianceStatValue} mono`}>
              {members.length} / {currentAlliance.max_members}
            </span>
          </div>
        </div>

        <div>
          {members.map((m) => (
            <div className={styles.memberRow} key={m.id}>
              <span>{memberNames[m.nation_id] ?? 'Unknown Nation'}</span>
              <span className={`badge ${m.role === 'LEADER' ? 'badge--positive' : 'badge--neutral'}`}>
                {m.role}
              </span>
            </div>
          ))}
        </div>

        {error ? <div className={styles.error}>{error}</div> : null}

        <button
          type="button"
          className="btn btn--outline"
          style={{ marginTop: 16 }}
          onClick={handleLeave}
          disabled={isPending}
        >
          {isPending ? 'Leaving…' : 'Leave Alliance'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className={`${styles.allianceCard} card`} style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, marginBottom: 12 }}>Found a New Alliance</h3>
        <form onSubmit={handleCreate}>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className="field__label" htmlFor="alliance-name">
                Alliance Name
              </label>
              <input
                id="alliance-name"
                className="input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Iron Concord"
              />
            </div>
            <div className={styles.formField}>
              <label className="field__label" htmlFor="alliance-tag">
                Tag (max 4)
              </label>
              <input
                id="alliance-tag"
                className="input"
                type="text"
                maxLength={4}
                value={tag}
                onChange={(e) => setTag(e.target.value.toUpperCase())}
                placeholder="e.g. IRON"
              />
            </div>
          </div>
          {error ? <div className={styles.error}>{error}</div> : null}
          <button type="submit" className="btn btn--primary" disabled={isPending}>
            {isPending ? 'Founding…' : 'Found Alliance ($1,000,000)'}
          </button>
        </form>
      </div>

      <div className={`${styles.allianceCard} card`}>
        <h3 style={{ fontSize: 14, marginBottom: 12 }}>Or Join an Existing Alliance</h3>
        {browsableAlliances.length === 0 ? (
          <div className={styles.emptyState}>No alliances exist yet — be the first to found one.</div>
        ) : (
          browsableAlliances.map((a) => (
            <div className={styles.browseRow} key={a.id}>
              <span>
                {a.name} <span className={styles.allianceTag}>[{a.tag}]</span>{' '}
                <span style={{ color: 'var(--color-ink-faint)' }}>
                  · {a.memberCount}/{a.max_members} members
                </span>
              </span>
              <button
                type="button"
                className={`btn btn--primary ${styles.smallBtn}`}
                onClick={() => handleJoin(a.id)}
                disabled={isPending || a.memberCount >= a.max_members}
              >
                {a.memberCount >= a.max_members ? 'Full' : 'Join'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}