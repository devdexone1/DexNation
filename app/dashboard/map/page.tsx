import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CONTINENTS } from '@/types/database'
import { formatNumber } from '@/lib/format'
import styles from './map.module.css'

export default async function GlobalMapPage() {
  const supabase = await createClient()

  const { data: allNations } = await supabase
    .from('nations')
    .select('id, name, continent_id, flag_url, population')
    .order('population', { ascending: false })

  const nationIds = (allNations ?? []).map((n) => n.id)
  let allianceByNation = new Map<string, string>()

  if (nationIds.length > 0) {
    const { data: memberships } = await supabase
      .from('alliance_members')
      .select('nation_id, alliance_id')
      .in('nation_id', nationIds)

    const allianceIds = Array.from(new Set((memberships ?? []).map((m) => m.alliance_id)))
    if (allianceIds.length > 0) {
      const { data: alliances } = await supabase.from('alliances').select('id, tag').in('id', allianceIds)
      const tagById = new Map((alliances ?? []).map((a) => [a.id, a.tag]))
      allianceByNation = new Map(
        (memberships ?? []).map((m) => [m.nation_id, tagById.get(m.alliance_id) ?? ''])
      )
    }
  }

  return (
    <div>
      <div className={styles.header}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--color-ink-faint)' }}>
          World
        </div>
        <h1 className={styles.title}>Global Map</h1>
        <p className={styles.subtitle}>
          A directory of every nation, grouped by continent. Click a nation to view its
          public profile.
        </p>
      </div>

      <div className={styles.continentGrid}>
        {CONTINENTS.map((continentId) => {
          const nationsHere = (allNations ?? []).filter((n) => n.continent_id === continentId)
          return (
            <div key={continentId} className={`${styles.continentPanel} card`}>
              <div className={styles.continentName}>{continentId}</div>
              <div className={styles.continentCount}>{formatNumber(nationsHere.length)} nation{nationsHere.length === 1 ? '' : 's'}</div>

              {nationsHere.length === 0 ? (
                <div className={styles.emptyState}>No nations here yet.</div>
              ) : (
                nationsHere.map((n) => (
                  <Link key={n.id} href={`/dashboard/nations/${n.id}`} className={styles.nationRow}>
                    <div className={styles.nationFlag}>
                      {n.flag_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={n.flag_url} alt="" className={styles.nationFlagImg} />
                      ) : null}
                    </div>
                    <div className={styles.nationInfo}>
                      <div className={styles.nationName}>{n.name}</div>
                      {allianceByNation.get(n.id) ? (
                        <div className={styles.nationAlliance}>[{allianceByNation.get(n.id)}]</div>
                      ) : null}
                    </div>
                  </Link>
                ))
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}