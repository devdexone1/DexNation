import { createClient } from './supabase/server'

export interface AdminInfo {
  isAdmin: boolean
  rank: number | null
  rankTitle: string | null
  canMute: boolean
  canBan: boolean
  maxBanDays: number
  canEditStats: boolean
}

const NOT_ADMIN: AdminInfo = {
  isAdmin: false,
  rank: null,
  rankTitle: null,
  canMute: false,
  canBan: false,
  maxBanDays: 0,
  canEditStats: false,
}

// Centralized admin lookup — used by middleware.ts, dashboard/layout.tsx,
// and admin/page.tsx. Previously this join (admins + admin_rank_permissions)
// was duplicated in 3 places; now it lives in exactly one.
export async function getAdminInfo(userId: string | undefined | null): Promise<AdminInfo> {
  if (!userId) return NOT_ADMIN

  const supabase = await createClient()

  const { data: adminRow } = await supabase.from('admins').select('rank').eq('user_id', userId).maybeSingle()
  if (!adminRow) return NOT_ADMIN

  const { data: perm } = await supabase
    .from('admin_rank_permissions')
    .select('title, can_mute, can_ban, max_ban_days, can_edit_stats')
    .eq('rank', adminRow.rank)
    .maybeSingle()

  return {
    isAdmin: true,
    rank: adminRow.rank,
    rankTitle: perm?.title ?? null,
    canMute: perm?.can_mute ?? false,
    canBan: perm?.can_ban ?? false,
    maxBanDays: perm?.max_ban_days ?? 0,
    canEditStats: perm?.can_edit_stats ?? false,
  }
}