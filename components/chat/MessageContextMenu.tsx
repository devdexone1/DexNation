'use client'

import { useState } from 'react'
import Link from 'next/link'
import { reportChatMessageAction, deleteChatMessageAction } from '@/app/dashboard/chat-actions'
import { mutePlayerAction, banPlayerAction } from '@/app/admin/actions'
import ConfirmButton from '@/components/ConfirmButton'
import styles from './chat-widget.module.css'

export default function MessageContextMenu({
  messageId,
  senderUserId,
  senderNationId,
  isAdmin,
  canMute,
  canBan,
  maxBanDays,
  currentUserId,
  onClose,
}: {
  messageId: string
  senderUserId: string
  senderNationId: string | null
  isAdmin: boolean
  canMute: boolean
  canBan: boolean
  maxBanDays: number
  currentUserId: string | null
  onClose: () => void
}) {
  const [reporting, setReporting] = useState(false)
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState('')

  async function handleReport() {
    const result = await reportChatMessageAction(messageId, reason)
    setStatus(result.error ? result.error : 'Reported.')
    setTimeout(onClose, 1200)
  }

  async function handleMute() {
    const result = await mutePlayerAction(senderUserId, 60, 'Muted from chat')
    setStatus(result.error ?? 'Muted for 1 hour.')
    setTimeout(onClose, 1200)
  }

  async function handleBan() {
    const days = Math.min(1, maxBanDays)
    const result = await banPlayerAction(senderUserId, days, 'Banned from chat')
    setStatus(result.error ?? `Banned for ${days} day(s).`)
    setTimeout(onClose, 1200)
  }

  async function handleDelete() {
    const result = await deleteChatMessageAction(messageId)
    setStatus(result.error ?? 'Deleted.')
    setTimeout(onClose, 800)
  }

  return (
    <div className={styles.contextMenu} onClick={(e) => e.stopPropagation()}>
      {senderNationId ? (
        <Link href={`/dashboard/nations/${senderNationId}`} className={styles.contextItem} onClick={onClose}>
          Visit Profile
        </Link>
      ) : null}

      {!reporting ? (
        <button type="button" className={styles.contextItem} onClick={() => setReporting(true)}>
          Report
        </button>
      ) : (
        <div className={styles.reportInput}>
          <input
            className="input"
            style={{ fontSize: 11, padding: '6px 8px', marginBottom: 6 }}
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <ConfirmButton
            label="Submit Report"
            confirmLabel="Confirm Report"
            onConfirm={handleReport}
            className="btn btn--outline"
          />
        </div>
      )}

      {currentUserId === senderUserId || (isAdmin && canMute) ? (
        <div style={{ padding: '4px 8px' }}>
          <ConfirmButton label="Delete Message" confirmLabel="Confirm Delete" onConfirm={handleDelete} className={`${styles.contextItem} ${styles.contextItemDanger}`} />
        </div>
      ) : null}

      {isAdmin && canMute ? (
        <div style={{ padding: '4px 8px' }}>
          <ConfirmButton label="Mute (1h)" confirmLabel="Confirm Mute" onConfirm={handleMute} className={`${styles.contextItem} ${styles.contextItemDanger}`} />
        </div>
      ) : null}

      {isAdmin && canBan ? (
        <div style={{ padding: '4px 8px' }}>
          <ConfirmButton label="Ban" confirmLabel="Confirm Ban" onConfirm={handleBan} className={`${styles.contextItem} ${styles.contextItemDanger}`} />
        </div>
      ) : null}

      {status ? <div style={{ padding: '6px 12px', fontSize: 11 }}>{status}</div> : null}
    </div>
  )
}