'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateLeaderNameAction } from './actions'
import styles from './profile.module.css'

export default function LeaderNameForm({
  nationId,
  currentLeaderName,
}: {
  nationId: string
  currentLeaderName: string | null
}) {
  const router = useRouter()
  const [name, setName] = useState(currentLeaderName ?? '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const trimmed = name.trim()
    if (trimmed.length > 40) {
      setError('Leader name must be at most 40 characters.')
      return
    }

    startTransition(async () => {
      const result = await updateLeaderNameAction(nationId, trimmed)
      if (result.error) {
        setError(result.error)
        return
      }
      setSuccess('Leader name updated.')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.renameRow}>
        <input
          className={`input ${styles.renameInput}`}
          type="text"
          placeholder="e.g. President Hakan Şimşek"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
        />
        <button type="submit" className="btn btn--primary" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
      {error ? <div className={styles.error}>{error}</div> : null}
      {success ? <div className={styles.success}>{success}</div> : null}
    </form>
  )
}