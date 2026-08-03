'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
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
      try {
        const supabase = createClient()
        const { error: rpcError } = await supabase.rpc('queue_research', {
          p_nation_id: nationId,
          p_tech_id: techId,
        })
        if (rpcError) {
          setError(rpcError.message)
          return
        }
        window.location.reload()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      }
    })
  }

  function handleDequeue() {
    setError('')
    startTransition(async () => {
      try {
        const supabase = createClient()
        const { error: rpcError } = await supabase.rpc('dequeue_research', {
          p_nation_id: nationId,
          p_tech_id: techId,
        })
        if (rpcError) {
          setError(rpcError.message)
          return
        }
        window.location.reload()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      }
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