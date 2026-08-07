import styles from './FlagStand.module.css'

export default function FlagStand({
  flagUrl,
  side,
}: {
  flagUrl: string | null
  side: 'left' | 'right'
}) {
  return (
    <div className={styles.stand}>
      <div className={styles.finial} />
      <div className={styles.pole} />
      <div className={styles.base} />
      <div className={`${styles.banner} ${side === 'left' ? styles['banner--left'] : styles['banner--right']}`}>
        {flagUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={flagUrl} alt="" className={styles.bannerImg} />
        ) : null}
      </div>
    </div>
  )
}