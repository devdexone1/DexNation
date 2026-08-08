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