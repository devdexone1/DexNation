'use client'

import { useState, useTransition } from 'react'
import { resolveChatReportAction } from './actions'
import { mutePlayerAction, banPlayerAction } from './actions'
import ConfirmButton from '@/components/ConfirmButton'
import type { OpenChatReport } from '@/types/database'
import styles from './admin.module.css'

export default function ChatReportsPanel({
  reports,
  canMute,
  canBan,
}: {
  reports: OpenChatReport[]
  canMute: boolean
  canBan: boolean
}) {
  const [resolved, setResolved] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  function handleResolve(reportId: string) {
    startTransition(async () => {
      await resolveChatReportAction(reportId)
      setResolved((prev) => new Set(prev).add(reportId))
    })
  }

  function handleMute(userId: string, reportId: string) {
    startTransition(async () => {
      await mutePlayerAction(userId, 60, 'Muted from chat report review')
      await resolveChatReportAction(reportId)
      setResolved((prev) => new Set(prev).add(reportId))
    })
  }

  function handleBan(userId: string, reportId: string) {
    startTransition(async () => {
      await banPlayerAction(userId, 1, 'Banned from chat report review')
      await resolveChatReportAction(reportId)
      setResolved((prev) => new Set(prev).add(reportId))
    })
  }

  const visible = reports.filter((r) => !resolved.has(r.report_id))

  if (visible.length === 0) {
    return <div className={styles.reportMeta}>No open reports.</div>
  }

  return (
    <div className={`${styles.panel} card`}>
      {visible.map((r) => (
        <div className={styles.reportCard} key={r.report_id}>
          <div className={styles.reportMeta}>
            Reported by <strong>{r.reporter_nation_name ?? 'Unknown'}</strong> ·{' '}
            {new Date(r.created_at).toLocaleString()}
            {r.reason ? ` · Reason: ${r.reason}` : ''}
          </div>
          <div className={styles.reportMessage}>
            <strong>{r.sender_nation_name}:</strong> {r.message_text}
          </div>
          <div className={styles.reportActions}>
            <button type="button" className="btn btn--outline" style={{ padding: '6px 12px', fontSize: 11.5 }} onClick={() => handleResolve(r.report_id)} disabled={isPending}>
              Dismiss
            </button>
            {canMute ? (
              <ConfirmButton
                label="Mute Sender (1h)"
                confirmLabel="Confirm Mute"
                onConfirm={() => handleMute(r.sender_user_id, r.report_id)}
                className="btn btn--outline"
              />
            ) : null}
            {canBan ? (
              <ConfirmButton
                label="Ban Sender (1d)"
                confirmLabel="Confirm Ban"
                onConfirm={() => handleBan(r.sender_user_id, r.report_id)}
                className="btn btn--primary"
              />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}