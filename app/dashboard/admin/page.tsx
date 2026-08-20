import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminInfo } from '@/lib/getAdminInfo'
import AdminShell from './AdminShell'

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const adminInfo = await getAdminInfo(user?.id)

  // Defense in depth: middleware.ts already blocks non-admins from ever
  // reaching /dashboard/admin, but this page re-checks on its own too,
  // so no sensitive data (player list, chat reports, etc.) is ever
  // fetched or rendered if that config ever changes.
  if (!adminInfo.isAdmin) {
    redirect('/dashboard')
  }

  const isSeniorAdmin = adminInfo.rank !== null && adminInfo.rank >= 3

  const [nationsCountRes, tradesCountRes, warsCountRes, nationsRes, reportsRes, trophyDefsRes, newsRes] =
    await Promise.all([
      supabase.from('nations').select('id', { count: 'exact', head: true }),
      supabase.from('p2p_trade_history').select('id', { count: 'exact', head: true }),
      supabase.from('active_wars').select('id', { count: 'exact', head: true }).eq('war_status', 'ACTIVE'),
      supabase.from('nations').select('id, user_id, name').order('created_at', { ascending: false }).limit(50),
      supabase.rpc('get_open_chat_reports'),
      supabase.from('national_trophies').select('*'),
      supabase.from('news_items').select('*').order('created_at', { ascending: false }).limit(50),
    ])

  return (
    <AdminShell
      adminInfo={adminInfo}
      isSeniorAdmin={isSeniorAdmin}
      stats={{
        nations: nationsCountRes.count ?? 0,
        trades: tradesCountRes.count ?? 0,
        wars: warsCountRes.count ?? 0,
      }}
      nations={nationsRes.data ?? []}
      reports={reportsRes.data ?? []}
      trophyDefs={trophyDefsRes.data ?? []}
      newsItems={newsRes.data ?? []}
    />
  )
}