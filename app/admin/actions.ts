'use server'

import { createClient } from '@/lib/supabase/server'

interface ActionResult {
  error?: string
  success?: boolean
}

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

export async function editNationStatAction(
  targetNationId: string,
  field: string,
  newValue: number
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_update_nation_stat', {
    p_target_nation_id: targetNationId,
    p_field: field,
    p_new_value: newValue,
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