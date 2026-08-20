'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './ToolInfo.module.css'

export default function ToolInfo({ title, children, dark = false }: { title: string; children: React.ReactNode; dark?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <span className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={`${styles.icon} ${dark ? styles['icon--dark'] : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={`About ${title}`}
      >
        !
      </button>
      {open ? (
        <div className={styles.popover}>
          <div className={styles.popoverTitle}>{title}</div>
          {children}
        </div>
      ) : null}
    </span>
  )
}