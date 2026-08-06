'use client'

import { useState, useTransition } from 'react'
import { declareWarAction } from '@/app/dashboard/military/actions'
import styles from './nation-profile.module.css'

export default function DeclareWarFromProfile({
  viewerNationId,
  targetNationId,
}: {
  viewerNationId: string
  targetNationId: string
}) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDeclare() {
    setError('')
    startTransition(async () => {
      const result = await declareWarAction(viewerNationId, targetNationId)
      if (result.error) {
        setError(result.error)
        return
      }
      setSuccess(true)
    })
  }

  if (success) {
    return <div className={styles.actionRow}><span className="badge badge--positive">War Declared</span></div>
  }

  return (
    <div>
      <div className={styles.actionRow}>
        <button type="button" className="btn btn--primary" onClick={handleDeclare} disabled={isPending}>
          {isPending ? 'Declaring…' : 'Declare War'}
        </button>
      </div>
      {error ? <div className={styles.error}>{error}</div> : null}
    </div>
  )
}