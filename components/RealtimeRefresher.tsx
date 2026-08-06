'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export interface RealtimeWatch {
  table: string
  filter?: string // e.g. "nation_id=eq.<uuid>"
}

// Invisible component: subscribes to Postgres changes on the given tables and
// calls router.refresh() whenever something relevant changes — including
// changes made by OTHER players, not just the current user's own actions.
export default function RealtimeRefresher({
  watches,
  channelName,
}: {
  watches: RealtimeWatch[]
  channelName: string
}) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let channel = supabase.channel(channelName)

    for (const w of watches) {
      channel = channel.on(
        'postgres_changes' as never,
        { event: '*', schema: 'public', table: w.table, filter: w.filter } as never,
        () => {
          router.refresh()
        }
      )
    }

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}