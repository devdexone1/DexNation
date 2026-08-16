import GaugeChart from './GaugeChart'
import styles from './overview.module.css'

interface FlagRef {
  id: string
  name: string
  flag_url: string | null
}

export default function CompositeGeopoliticsCard({
  economicHealth,
  militaryReadiness,
  allianceLabel,
  allianceMemberFlags,
  warOpponentFlags,
}: {
  economicHealth: number
  militaryReadiness: number
  allianceLabel: string | null
  allianceMemberFlags: FlagRef[]
  warOpponentFlags: FlagRef[]
}) {
  return (
    <div className={`${styles.panel} card`}>
      <h2 className={styles.panelTitle}>Composite Indexes</h2>
      <div className={styles.gaugeRow}>
        <GaugeChart value={economicHealth} label="Economic Health" sublabel="Rating" />
        <GaugeChart value={militaryReadiness} label="Military Readiness" sublabel="Index" />
      </div>

      <h2 className={styles.panelTitle} style={{ marginTop: 20 }}>Geopolitics</h2>

      <div className={styles.geoSectionTitle}>Alliance{allianceLabel ? ` — ${allianceLabel}` : ''}</div>
      {allianceMemberFlags.length === 0 ? (
        <div className={styles.empty} style={{ marginBottom: 14 }}>No alliance.</div>
      ) : (
        <div className={styles.miniFlagRow}>
          {allianceMemberFlags.map((n) => (
            <div className={styles.miniFlag} key={n.id} title={n.name}>
              {n.flag_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={n.flag_url} alt="" className={styles.miniFlagImg} />
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className={styles.geoSectionTitle}>War Status</div>
      {warOpponentFlags.length === 0 ? (
        <span className={`${styles.warPill} ${styles.warPillPeace}`}>At Peace</span>
      ) : (
        <div>
          <span className={`${styles.warPill} ${styles.warPillActive}`} style={{ marginBottom: 8, display: 'inline-block' }}>
            Active ({warOpponentFlags.length})
          </span>
          <div className={styles.miniFlagRow}>
            {warOpponentFlags.map((n) => (
              <div className={styles.miniFlag} key={n.id} title={n.name}>
                {n.flag_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.flag_url} alt="" className={styles.miniFlagImg} />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}