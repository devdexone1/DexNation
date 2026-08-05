'use client'

import { useState, useTransition } from 'react'
import { proposeAllianceTreatyAction, respondAllianceTreatyAction, cancelAllianceTreatyAction } from './actions'
import type { AllianceTreaty } from '@/types/database'
import styles from './politics.module.css'

interface EnrichedTreaty extends AllianceTreaty {
  partnerName?: string
}

export default function AllianceTreaties({
  nationId,
  currentAllianceId,
  isLeader,
  treaties,
  otherAlliances,
}: {
  nationId: string
  currentAllianceId: string
  isLeader: boolean
  treaties: EnrichedTreaty[]
  otherAlliances: { id: string; name: string; tag: string }[]
}) {
  const [targetId, setTargetId] = useState(otherAlliances[0]?.id ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handlePropose() {
    setError('')
    startTransition(async () => {
      const result = await proposeAllianceTreatyAction(nationId, targetId)
      if (result.error) { setError(result.error); return }
      window.location.reload()
    })
  }

  function handleRespond(treatyId: string, accept: boolean) {
    setError('')
    startTransition(async () => {
      const result = await respondAllianceTreatyAction(nationId, treatyId, accept)
      if (result.error) { setError(result.error); return }
      window.location.reload()
    })
  }

  function handleCancel(treatyId: string) {
    setError('')
    startTransition(async () => {
      const result = await cancelAllianceTreatyAction(nationId, treatyId)
      if (result.error) { setError(result.error); return }
      window.location.reload()
    })
  }

  const incoming = treaties.filter((t) => t.status === 'PROPOSED' && t.proposed_by_alliance_id !== currentAllianceId)
  const others = treaties.filter((t) => !(t.status === 'PROPOSED' && t.proposed_by_alliance_id !== currentAllianceId))

  return (
    <div className={`${styles.allianceCard} card`}>
      <h3 style={{ fontSize: 14, marginBottom: 10 }}>FTA Treaties</h3>
      <p className={styles.notifMeta} style={{ marginBottom: 10 }}>
        Active treaties drop the trade tax from 15% to 5% between your alliances, split
        50/30/20 (seller alliance / buyer alliance / World Bank).
      </p>

      {error ? <div className={styles.error}>{error}</div> : null}

      {incoming.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {incoming.map((t) => (
            <div className={styles.treatyRow} key={t.id}>
              <span>Proposal from <strong>{t.partnerName ?? 'Unknown'}</strong></span>
              {isLeader ? (
                <div className={styles.treatyActions}>
                  <button type="button" className="btn btn--primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleRespond(t.id, true)} disabled={isPending}>Accept</button>
                  <button type="button" className="btn btn--outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleRespond(t.id, false)} disabled={isPending}>Reject</button>
                </div>
              ) : (
                <span className={styles.notifMeta}>Waiting on your Leader</span>
              )}
            </div>
          ))}
        </div>
      )}

      {others.length === 0 && incoming.length === 0 ? (
        <div className={styles.notifMeta}>No treaties yet.</div>
      ) : (
        others.map((t) => (
          <div className={styles.treatyRow} key={t.id}>
            <span>{t.partnerName ?? 'Unknown'}</span>
            <div className={styles.treatyActions}>
              <span className={`badge ${t.status === 'ACTIVE' ? 'badge--positive' : 'badge--neutral'}`}>{t.status}</span>
              {isLeader && t.status === 'ACTIVE' ? (
                <button type="button" className="btn btn--outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleCancel(t.id)} disabled={isPending}>Cancel</button>
              ) : null}
            </div>
          </div>
        ))
      )}

      {isLeader && otherAlliances.length > 0 ? (
        <div className={styles.proposeTreatyRow}>
          <select className="select" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            {otherAlliances.map((a) => (
              <option key={a.id} value={a.id}>{a.name} [{a.tag}]</option>
            ))}
          </select>
          <button type="button" className="btn btn--primary" onClick={handlePropose} disabled={isPending}>
            {isPending ? 'Proposing…' : 'Propose Treaty'}
          </button>
        </div>
      ) : null}
    </div>
  )
}