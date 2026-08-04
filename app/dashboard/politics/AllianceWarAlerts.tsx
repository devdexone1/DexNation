import Link from 'next/link'
import type { AllianceWarNotification } from '@/types/database'
import styles from './politics.module.css'

interface EnrichedNotification extends AllianceWarNotification {
  allyName?: string
  attackerName?: string
}

export default function AllianceWarAlerts({
  notifications,
}: {
  notifications: EnrichedNotification[]
}) {
  if (notifications.length === 0) {
    return (
      <div className={styles.notifMeta} style={{ marginBottom: 16 }}>
        No alliance members have been attacked recently.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
      {notifications.map((n) => (
        <div className={`${styles.notifCard} card`} key={n.id}>
          <div>
            <div className={styles.notifText}>
              <strong>{n.allyName ?? 'An ally'}</strong> was attacked by{' '}
              <strong>{n.attackerName ?? 'Unknown'}</strong>
            </div>
            <div className={styles.notifMeta}>{new Date(n.created_at).toLocaleString()}</div>
          </div>
          <Link href={`/dashboard/military/war/${n.war_id}`}>
            <button type="button" className="btn btn--outline" style={{ padding: '8px 14px', fontSize: 12.5 }}>
              View War
            </button>
          </Link>
        </div>
      ))}
    </div>
  )
}