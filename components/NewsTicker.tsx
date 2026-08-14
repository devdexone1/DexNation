import styles from './NewsTicker.module.css'

export default function NewsTicker({ items }: { items: { id: string; message: string }[] }) {
  if (items.length === 0) return null

  // Duplicate the list so the CSS animation loops seamlessly.
  const looped = [...items, ...items]

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>News</span>
      <div className={styles.track}>
        {looped.map((n, i) => (
          <span className={styles.item} key={`${n.id}-${i}`}>
            {n.message}
          </span>
        ))}
      </div>
    </div>
  )
}