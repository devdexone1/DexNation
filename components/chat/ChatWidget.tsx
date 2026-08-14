'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendChatMessageAction } from '@/app/dashboard/chat-actions'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import type { ChatMessage } from '@/types/database'
import MessageContextMenu from './MessageContextMenu'
import styles from './chat-widget.module.css'

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

export default function ChatWidget({
  myContinentId,
  adminInfo,
  currentUserId,
}: {
  myContinentId: string | null
  adminInfo: { isAdmin: boolean; canMute: boolean; canBan: boolean; maxBanDays: number } | null
  currentUserId: string | null
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!openMenuId) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'CONTINENT' | 'GLOBAL'>('GLOBAL')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function loadMessages() {
      const supabase = createClient()
      const query = supabase
        .from('chat_messages')
        .select('*')
        .eq('scope', tab)
        .order('created_at', { ascending: true })
        .limit(50)

      const { data } = tab === 'CONTINENT' && myContinentId
        ? await query.eq('continent_id', myContinentId)
        : await query

      if (!cancelled) setMessages(data ?? [])
    }

    loadMessages()

    const supabase = createClient()
    const channel = supabase
      .channel(`chat-${tab}-${myContinentId ?? 'global'}`)
      .on(
        'postgres_changes' as never,
        { event: 'INSERT', schema: 'public', table: 'chat_messages' } as never,
        (payload: { new: ChatMessage }) => {
          const msg = payload.new
          if (msg.scope !== tab) return
          if (tab === 'CONTINENT' && msg.continent_id !== myContinentId) return
          setMessages((prev) => [...prev, msg])
        }
      )
      .on(
        'postgres_changes' as never,
        { event: 'DELETE', schema: 'public', table: 'chat_messages' } as never,
        (payload: { old: { id: string } }) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [open, tab, myContinentId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const trimmed = input.trim()
    if (!trimmed) return

    const result = await sendChatMessageAction(tab, trimmed)
    if (result.error) {
      setError(result.error)
      return
    }
    setInput('')
  }

  return (
    <>
      <button type="button" className={styles.launcher} onClick={() => setOpen((v) => !v)} aria-label="Toggle chat">
        <ChatIcon />
      </button>

      {open ? (
        <div className={styles.panel}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${tab === 'CONTINENT' ? styles.tabActive : ''}`}
              onClick={() => setTab('CONTINENT')}
            >
              Continent
            </button>
            <button
              type="button"
              className={`${styles.tab} ${tab === 'GLOBAL' ? styles.tabActive : ''}`}
              onClick={() => setTab('GLOBAL')}
            >
              Global
            </button>
          </div>

          <div className={styles.messages}>
            {messages.length === 0 ? (
              <div className={styles.emptyState}>No messages yet — say hello.</div>
            ) : (
              messages.map((m) => (
                <div
                  className={styles.messageRowWrap}
                  key={m.id}
                  ref={openMenuId === m.id ? menuRef : null}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setOpenMenuId(m.id)
                  }}
                >
                  <div className={styles.messageRow} style={{ flex: 1 }}>
                    <span className={styles.messageSender}>{m.sender_nation_name}:</span>
                    {m.message}
                    <span className={styles.messageTime}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.moreBtn}
                    onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)}
                  >
                    ⋮
                  </button>
                  {openMenuId === m.id ? (
                    <MessageContextMenu
                      messageId={m.id}
                      senderUserId={m.sender_user_id}
                      senderNationId={m.sender_nation_id}
                      isAdmin={adminInfo?.isAdmin ?? false}
                      canMute={adminInfo?.canMute ?? false}
                      canBan={adminInfo?.canBan ?? false}
                      maxBanDays={adminInfo?.maxBanDays ?? 0}
                      currentUserId={currentUserId}
                      onClose={() => setOpenMenuId(null)}
                    />
                  ) : null}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {error ? <div className={styles.error}>{error}</div> : null}

          <form className={styles.inputRow} onSubmit={handleSend}>
            <input
              className={styles.input}
              type="text"
              maxLength={500}
              placeholder={`Message ${tab === 'CONTINENT' ? 'your continent' : 'everyone'}…`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className={`btn btn--primary ${styles.sendBtn}`}>
              Send
            </button>
          </form>
        </div>
      ) : null}
    </>
  )
}