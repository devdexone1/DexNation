'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export interface RealtimeWatch {
  table: string
  filter?: string
}

export default function RealtimeRefresher({
  watches,
  channelName,
}: {
  watches: RealtimeWatch[]
  channelName: string
}) {
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let channel = supabase.channel(channelName)

    function scheduleRefresh() {
      // FIX (BUG-010): collapse bursts of near-simultaneous changes (misal
      // belasan resource berubah bersamaan pas Daily Tick) jadi 1 refresh,
      // bukan router.refresh() berkali-kali beruntun.
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        router.refresh()
      }, 800)
    }

    for (const w of watches) {
      channel = channel.on(
        'postgres_changes' as never,
        { event: '*', schema: 'public', table: w.table, filter: w.filter } as never,
        () => {
          scheduleRefresh()
        }
      )
    }

    channel.subscribe()

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}