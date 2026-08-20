import type { NationalTrophy, NationTrophy } from '@/types/database'
import styles from './overview.module.css'

function isImageIcon(icon: string): boolean {
  return icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/')
}

export default function TrophiesRow({
  trophies,
  trophyDefs,
}: {
  trophies: NationTrophy[]
  trophyDefs: NationalTrophy[]
}) {
  const defById = new Map(trophyDefs.map((d) => [d.id, d]))

  return (
    <div style={{ marginTop: 14 }}>
      <div className={styles.honorsSectionTitle}>National Trophies</div>
      {trophies.length === 0 ? (
        <div className={styles.empty} style={{ fontSize: 11.5 }}>No trophies awarded yet.</div>
      ) : (
        <div className={styles.trophiesGrid}>
          {trophies.map((t) => {
            const def = defById.get(t.trophy_id)
            const icon = def?.icon ?? '🏅'
            return (
              <div key={t.id} className={styles.trophyBadge} title={def?.title ?? t.trophy_id}>
                {isImageIcon(icon) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={icon} alt={def?.title ?? ''} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  icon
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}