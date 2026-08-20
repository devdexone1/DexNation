'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addNewsAction, editNewsAction, deleteNewsAction, toggleNewsActiveAction } from './actions'
import ConfirmButton from '@/components/ConfirmButton'
import styles from './admin.module.css'

interface NewsItem {
  id: string
  message: string
  is_active: boolean
  created_at: string
}

export default function NewsManagementPanel({ items }: { items: NewsItem[] }) {
  const router = useRouter()
  const [newMessage, setNewMessage] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [status, setStatus] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAdd() {
    if (!newMessage.trim()) return
    startTransition(async () => {
      const result = await addNewsAction(newMessage.trim())
      setStatus(result.error ?? 'News item added.')
      if (!result.error) {
        setNewMessage('')
        router.refresh()
      }
    })
  }

  function handleSaveEdit(id: string) {
    if (!editingText.trim()) return
    startTransition(async () => {
      const result = await editNewsAction(id, editingText.trim())
      setStatus(result.error ?? 'News item updated.')
      if (!result.error) {
        setEditingId(null)
        router.refresh()
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteNewsAction(id)
      setStatus(result.error ?? 'News item deleted.')
      if (!result.error) router.refresh()
    })
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleNewsActiveAction(id, !current)
      setStatus(result.error ?? (current ? 'News item hidden.' : 'News item shown.'))
      if (!result.error) router.refresh()
    })
  }

  return (
    <div className={`${styles.panel} card`}>
      <div className={styles.formInline} style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="New news item message…"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleAdd}
          disabled={isPending || !newMessage.trim()}
        >
          Add News
        </button>
      </div>

      {status ? <div style={{ fontSize: 12, marginBottom: 10 }}>{status}</div> : null}

      {items.length === 0 ? (
        <div className={styles.reportMeta}>No news items yet.</div>
      ) : (
        items.map((item) => (
          <div key={item.id} className={styles.newsRow}>
            {editingId === item.id ? (
              <div className={styles.formInline} style={{ flex: 1, flexWrap: 'wrap' }}>
                <input
                  className="input"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  style={{ flex: 1, minWidth: 220 }}
                />
                <button
                  type="button"
                  className="btn btn--primary"
                  style={{ padding: '6px 12px', fontSize: 11.5 }}
                  onClick={() => handleSaveEdit(item.id)}
                  disabled={isPending}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn--outline"
                  style={{ padding: '6px 12px', fontSize: 11.5 }}
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div className={styles.newsRowText}>
                  <span className={item.is_active ? styles.newsBadgeActive : styles.newsBadgeHidden}>
                    {item.is_active ? 'Live' : 'Hidden'}
                  </span>
                  {item.message}
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className="btn btn--outline"
                    style={{ padding: '6px 12px', fontSize: 11.5 }}
                    onClick={() => {
                      setEditingId(item.id)
                      setEditingText(item.message)
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn--outline"
                    style={{ padding: '6px 12px', fontSize: 11.5 }}
                    onClick={() => handleToggle(item.id, item.is_active)}
                    disabled={isPending}
                  >
                    {item.is_active ? 'Hide' : 'Show'}
                  </button>
                  <ConfirmButton
                    label="Delete"
                    confirmLabel="Confirm Delete"
                    onConfirm={() => handleDelete(item.id)}
                    className="btn btn--primary"
                    disabled={isPending}
                  />
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  )
}