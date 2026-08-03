import styles from './ComingSoon.module.css'

export default function ComingSoon({
  title,
  description,
  specRef,
}: {
  title: string
  description: string
  specRef?: string
}) {
  return (
    <div className={styles.comingSoon}>
      <div className={styles.eyebrow}>Coming Soon</div>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.desc}>{description}</p>
      {specRef ? <span className={styles.ref}>{specRef}</span> : null}
    </div>
  )
}
