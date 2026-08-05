'use client'

import { useState, useTransition } from 'react'
import { queueResearchAction, dequeueResearchAction } from './actions'
import styles from './research.module.css'

export default function TechNodeActions({
  nationId,
  techId,
  nodeState,
}: {
  nationId: string
  techId: string
  nodeState: 'locked' | 'available' | 'queued' | 'completed'
}) {
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleQueue() {
    setError('')
    startTransition(async () => {
      const result = await queueResearchAction(nationId, techId)
      if (result.error) {
        setError(result.error)
        return
      }
      window.location.reload()
    })
  }

  function handleDequeue() {
    setError('')
    startTransition(async () => {
      const result = await dequeueResearchAction(nationId, techId)
      if (result.error) {
        setError(result.error)
        return
      }
      window.location.reload()
    })
  }

  if (nodeState === 'completed') {
    return <span className="badge badge--positive">Completed</span>
  }

  if (nodeState === 'locked') {
    return <span className="badge badge--neutral">Locked</span>
  }

  if (nodeState === 'queued') {
    return (
      <div className={styles.nodeActions}>
        {error ? <span className={styles.nodeError}>{error}</span> : null}
        <button
          type="button"
          className={`btn btn--outline ${styles.smallBtn}`}
          onClick={handleDequeue}
          disabled={isPending}
        >
          {isPending ? 'Removing…' : 'Remove from queue'}
        </button>
      </div>
    )
  }

  return (
    <div className={styles.nodeActions}>
      {error ? <span className={styles.nodeError}>{error}</span> : null}
      <button
        type="button"
        className={`btn btn--primary ${styles.smallBtn}`}
        onClick={handleQueue}
        disabled={isPending}
      >
        {isPending ? 'Queuing…' : 'Add to Queue'}
      </button>
    </div>
  )
}