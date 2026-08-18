'use server'

import { createClient } from '@/lib/supabase/server'
import { getClientIp, logAudit, checkRateLimit } from '@/lib/audit'

interface ActionResult {
  error?: string
  success?: boolean
}

const ECONOMY_RATE_LIMIT_KEY = (userId: string) => `USER_${userId}_ENDPOINT_economy`

export async function buildBuildingAction(nationId: string, buildingTypeId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const ip = await getClientIp()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session not found. Please sign in again.' }

  const allowed = await checkRateLimit(ECONOMY_RATE_LIMIT_KEY(user.id), 10, 0.3)
  if (!allowed) {
    await logAudit(user.id, nationId, ip, 'RATE_LIMIT_EXCEEDED', { action: 'build_building' })
    return { error: 'Too many building actions — please slow down.' }
  }

  const { error } = await supabase.rpc('build_building', {
    p_nation_id: nationId,
    p_building_type_id: buildingTypeId,
  })

  if (error) {
    await logAudit(user.id, nationId, ip, 'ACTION_FAILED', { action: 'build_building', error: error.message })
    return { error: error.message }
  }

  await logAudit(user.id, nationId, ip, 'ACTION_SUCCESS', { action: 'build_building', buildingTypeId })
  return { success: true }
}

export async function upgradeBuildingAction(nationId: string, buildingId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const ip = await getClientIp()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session not found. Please sign in again.' }

  const allowed = await checkRateLimit(ECONOMY_RATE_LIMIT_KEY(user.id), 10, 0.3)
  if (!allowed) {
    await logAudit(user.id, nationId, ip, 'RATE_LIMIT_EXCEEDED', { action: 'upgrade_building' })
    return { error: 'Too many building actions — please slow down.' }
  }

  const { error } = await supabase.rpc('upgrade_building', {
    p_nation_id: nationId,
    p_building_id: buildingId,
  })

  if (error) {
    await logAudit(user.id, nationId, ip, 'ACTION_FAILED', { action: 'upgrade_building', error: error.message })
    return { error: error.message }
  }

  await logAudit(user.id, nationId, ip, 'ACTION_SUCCESS', { action: 'upgrade_building', buildingId })
  return { success: true }
}