'use server'

import { createClient } from '@/lib/supabase/server'
import { getAdminInfo } from '@/lib/getAdminInfo'

interface ActionResult {
  error?: string
  success?: boolean
}

const ADJUSTABLE_FIELDS = ['cash_balance', 'population', 'daily_gdp', 'research_points'] as const
type AdjustableField = (typeof ADJUSTABLE_FIELDS)[number]

async function getCurrentUserId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id
}

// Every sensitive action below re-checks rank >= 3 itself — never trust
// that the page/UI already filtered this out, since a server action can
// in principle be invoked directly, bypassing whatever tab is visible.
async function requireSeniorAdmin() {
  const userId = await getCurrentUserId()
  const adminInfo = await getAdminInfo(userId)
  if (!adminInfo.isAdmin || adminInfo.rank === null || adminInfo.rank < 3) {
    throw new Error('Not authorized: requires admin rank 3 or higher.')
  }
  return adminInfo
}

// ---------------------------------------------------------------------
// News management — rank 3+ only
// ---------------------------------------------------------------------
export async function addNewsAction(message: string): Promise<ActionResult> {
  await requireSeniorAdmin()
  const supabase = await createClient()
  const { error } = await supabase.rpc('post_news_item', { p_message: message })
  if (error) return { error: error.message }
  return { success: true }
}

export async function editNewsAction(newsId: string, message: string): Promise<ActionResult> {
  await requireSeniorAdmin()
  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_edit_news_item', {
    p_news_id: newsId,
    p_message: message,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteNewsAction(newsId: string): Promise<ActionResult> {
  await requireSeniorAdmin()
  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_delete_news_item', { p_news_id: newsId })
  if (error) return { error: error.message }
  return { success: true }
}

export async function toggleNewsActiveAction(newsId: string, isActive: boolean): Promise<ActionResult> {
  await requireSeniorAdmin()
  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_toggle_news_active', {
    p_news_id: newsId,
    p_is_active: isActive,
  })
  if (error) return { error: error.message }
  return { success: true }
}

// ---------------------------------------------------------------------
// Nation editor — rank 3+ only
// ---------------------------------------------------------------------
export async function setNationStatAction(
  targetNationId: string,
  field: AdjustableField,
  newValue: number
): Promise<ActionResult> {
  await requireSeniorAdmin()
  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_update_nation_stat', {
    p_target_nation_id: targetNationId,
    p_field: field,
    p_new_value: newValue,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function adjustNationStatAction(
  targetNationId: string,
  field: AdjustableField,
  delta: number
): Promise<ActionResult> {
  await requireSeniorAdmin()
  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_adjust_nation_stat', {
    p_target_nation_id: targetNationId,
    p_field: field,
    p_delta: delta,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateNationNameAction(nationId: string, newName: string): Promise<ActionResult> {
  await requireSeniorAdmin()
  const supabase = await createClient()
  const { error } = await supabase.rpc('update_nation_name', {
    p_nation_id: nationId,
    p_new_name: newName,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateLeaderNameAction(nationId: string, newLeaderName: string): Promise<ActionResult> {
  await requireSeniorAdmin()
  const supabase = await createClient()
  const { error } = await supabase.rpc('update_leader_name', {
    p_nation_id: nationId,
    p_new_leader_name: newLeaderName,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function awardTrophyAction(
  nationId: string,
  trophyId: string,
  note: string
): Promise<ActionResult> {
  await requireSeniorAdmin()
  const supabase = await createClient()
  const { error } = await supabase.rpc('award_trophy', {
    p_nation_id: nationId,
    p_trophy_id: trophyId,
    p_note: note || null,
  })
  if (error) return { error: error.message }
  return { success: true }
}

// ---------------------------------------------------------------------
// Player moderation & chat reports — moved from the old /admin page.
// Permission model UNCHANGED on purpose: still gated by canMute/canBan
// from admin_rank_permissions (not hard-locked to rank 3+), so lower
// rank moderators keep being able to do their job here too.
// ---------------------------------------------------------------------
export async function banPlayerAction(
  targetUserId: string,
  durationDays: number,
  reason: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('issue_ban', {
    p_target_user_id: targetUserId,
    p_duration_days: durationDays,
    p_reason: reason || null,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function mutePlayerAction(
  targetUserId: string,
  durationMinutes: number,
  reason: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('issue_mute', {
    p_target_user_id: targetUserId,
    p_duration_minutes: durationMinutes,
    p_reason: reason || null,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function resolveChatReportAction(reportId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('resolve_chat_report', { p_report_id: reportId })
  if (error) return { error: error.message }
  return { success: true }
}