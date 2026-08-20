'use server'

import { createClient } from '@/lib/supabase/server'
import { getClientIp, logAudit, checkRateLimit } from '@/lib/audit'

interface ActionResult {
  error?: string
  success?: boolean
}

const PROFILE_RATE_LIMIT_KEY = (userId: string) => `USER_${userId}_ENDPOINT_profile`

export async function renameNationAction(nationId: string, newName: string): Promise<ActionResult> {
  const supabase = await createClient()
  const ip = await getClientIp()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session not found. Please sign in again.' }

  // Rate limit: prevent spam-renaming (was previously unrestricted browser-direct calls)
  const allowed = await checkRateLimit(PROFILE_RATE_LIMIT_KEY(user.id), 5, 0.05)
  if (!allowed) {
    await logAudit(user.id, nationId, ip, 'RATE_LIMIT_EXCEEDED', { action: 'rename_nation' })
    return { error: 'Too many rename attempts — please slow down.' }
  }

  const { error } = await supabase.rpc('update_nation_name', {
    p_nation_id: nationId,
    p_new_name: newName,
  })

  if (error) {
    await logAudit(user.id, nationId, ip, 'ACTION_FAILED', { action: 'rename_nation', error: error.message })
    return { error: error.message }
  }

  await logAudit(user.id, nationId, ip, 'ACTION_SUCCESS', { action: 'rename_nation', newName })
  return { success: true }
}

export async function updateLeaderNameAction(nationId: string, newLeaderName: string): Promise<ActionResult> {
  const supabase = await createClient()
  const ip = await getClientIp()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session not found. Please sign in again.' }

  const allowed = await checkRateLimit(PROFILE_RATE_LIMIT_KEY(user.id), 5, 0.05)
  if (!allowed) {
    await logAudit(user.id, nationId, ip, 'RATE_LIMIT_EXCEEDED', { action: 'update_leader_name' })
    return { error: 'Too many update attempts — please slow down.' }
  }

  const { error } = await supabase.rpc('update_leader_name', {
    p_nation_id: nationId,
    p_new_leader_name: newLeaderName,
  })

  if (error) {
    await logAudit(user.id, nationId, ip, 'ACTION_FAILED', { action: 'update_leader_name', error: error.message })
    return { error: error.message }
  }

  await logAudit(user.id, nationId, ip, 'ACTION_SUCCESS', { action: 'update_leader_name', newLeaderName })
  return { success: true }
}

export async function updateNationFlagAction(
  nationId: string,
  flagUrl: string | null,
  flagFrame: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const ip = await getClientIp()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session not found. Please sign in again.' }

  const allowed = await checkRateLimit(PROFILE_RATE_LIMIT_KEY(user.id), 5, 0.05)
  if (!allowed) {
    await logAudit(user.id, nationId, ip, 'RATE_LIMIT_EXCEEDED', { action: 'update_nation_flag' })
    return { error: 'Too many update attempts — please slow down.' }
  }

  const { error } = await supabase.rpc('update_nation_flag', {
    p_nation_id: nationId,
    p_flag_url: flagUrl,
    p_flag_frame: flagFrame,
  })

  if (error) {
    await logAudit(user.id, nationId, ip, 'ACTION_FAILED', { action: 'update_nation_flag', error: error.message })
    return { error: error.message }
  }

  await logAudit(user.id, nationId, ip, 'ACTION_SUCCESS', { action: 'update_nation_flag', flagFrame })
  return { success: true }
}

export async function updateLeaderPhotoAction(
  nationId: string,
  photoUrl: string,
  photoFrame: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const ip = await getClientIp()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session not found. Please sign in again.' }

  const allowed = await checkRateLimit(PROFILE_RATE_LIMIT_KEY(user.id), 5, 0.05)
  if (!allowed) {
    await logAudit(user.id, nationId, ip, 'RATE_LIMIT_EXCEEDED', { action: 'update_leader_photo' })
    return { error: 'Too many update attempts — please slow down.' }
  }

  const { error } = await supabase.rpc('update_leader_photo', {
    p_nation_id: nationId,
    p_photo_url: photoUrl,
    p_photo_frame: photoFrame,
  })

  if (error) {
    await logAudit(user.id, nationId, ip, 'ACTION_FAILED', { action: 'update_leader_photo', error: error.message })
    return { error: error.message }
  }

  await logAudit(user.id, nationId, ip, 'ACTION_SUCCESS', { action: 'update_leader_photo', photoFrame })
  return { success: true }
}