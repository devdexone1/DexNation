import styles from './FlagDisplay.module.css'

export default function FlagDisplay({
  flagUrl,
  frame,
  size = 'normal',
}: {
  flagUrl: string | null
  frame: string
  size?: 'normal' | 'large' | 'hero'
}) {
  const frameClass = styles[`frame-${frame}`] ?? styles['frame-none']

  return (
    <div className={`${styles.wrap} ${frameClass}`}>
      <div
          className={`${styles.flagBox} ${
            size === 'hero' ? styles['flagBox--hero'] : size === 'large' ? styles['flagBox--large'] : ''
          }`}
        >
        {flagUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={flagUrl} alt="Nation flag" className={styles.flagImg} />
        ) : null}
      </div>
    </div>
  )
}