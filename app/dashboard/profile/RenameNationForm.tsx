'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './profile.module.css'

export default function RenameNationForm({
  nationId,
  currentName,
}: {
  nationId: string
  currentName: string
}) {
  const [name, setName] = useState(currentName)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const trimmed = name.trim()
    if (trimmed.length < 3) {
      setError('Nation name must be at least 3 characters long.')
      return
    }
    if (trimmed.length > 40) {
      setError('Nation name must be at most 40 characters long.')
      return
    }
    if (trimmed === currentName) {
      setError('That is already your current nation name.')
      return
    }

    startTransition(async () => {
      try {
        const supabase = createClient()
        const { error: updateError } = await supabase
          .from('nations')
          .update({ name: trimmed })
          .eq('id', nationId)

        if (updateError) {
          // Postgres unique_violation code
          if (updateError.code === '23505') {
            setError('That name is already taken by another nation.')
          } else {
            setError(updateError.message)
          }
          return
        }

        setSuccess('Nation renamed successfully.')
        setTimeout(() => window.location.reload(), 700)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.renameRow}>
        <input
          className={`input ${styles.renameInput}`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
        />
        <button type="submit" className="btn btn--primary" disabled={isPending}>
          {isPending ? 'Saving…' : 'Rename'}
        </button>
      </div>
      {error ? <div className={styles.error}>{error}</div> : null}
      {success ? <div className={styles.success}>{success}</div> : null}
    </form>
  )
}