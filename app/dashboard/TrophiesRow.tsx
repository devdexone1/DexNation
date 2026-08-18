import type { NationalTrophy, NationTrophy } from '@/types/database'
import styles from './overview.module.css'

export default function TrophiesRow({
  trophies,
  trophyDefs,
}: {
  trophies: NationTrophy[]
  trophyDefs: NationalTrophy[]
}) {
  if (trophies.length === 0) return null

  const defById = new Map(trophyDefs.map((d) => [d.id, d]))

  return (
    <div style={{ marginTop: 14 }}>
      <div className={styles.honorsSectionTitle}>National Trophies</div>
      <div className={styles.trophiesGrid}>
        {trophies.map((t) => {
          const def = defById.get(t.trophy_id)
          return (
            <div key={t.id} className={styles.trophyBadge} title={def?.title ?? t.trophy_id}>
              {def?.icon ?? '🏅'}
            </div>
          )
        })}
      </div>
    </div>
  )
}