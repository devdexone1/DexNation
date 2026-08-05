'use server'

import { createClient } from '@/lib/supabase/server'
import { getClientIp, logAudit, checkRateLimit } from '@/lib/audit'

interface ActionResult {
  error?: string
  success?: boolean
}

const MILITARY_RATE_LIMIT_KEY = (userId: string) => `USER_${userId}_ENDPOINT_military`

export async function recruitUnitAction(nationId: string, unitTypeId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const ip = await getClientIp()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Session not found. Please sign in again.' }

  const allowed = await checkRateLimit(MILITARY_RATE_LIMIT_KEY(user.id), 5, 0.1)
  if (!allowed) {
    await logAudit(user.id, nationId, ip, 'RATE_LIMIT_EXCEEDED', { action: 'recruit_unit' })
    return { error: 'Too many military actions — please slow down and try again in a few seconds.' }
  }

  const { error } = await supabase.rpc('recruit_unit', {
    p_nation_id: nationId,
    p_unit_type_id: unitTypeId,
  })

  if (error) {
    await logAudit(user.id, nationId, ip, 'ACTION_FAILED', { action: 'recruit_unit', error: error.message })
    return { error: error.message }
  }

  await logAudit(user.id, nationId, ip, 'ACTION_SUCCESS', { action: 'recruit_unit', unitTypeId })
  return { success: true }
}

export async function declareWarAction(
  attackerNationId: string,
  defenderNationId: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const ip = await getClientIp()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Session not found. Please sign in again.' }

  const allowed = await checkRateLimit(MILITARY_RATE_LIMIT_KEY(user.id), 5, 0.1)
  if (!allowed) {
    await logAudit(user.id, attackerNationId, ip, 'RATE_LIMIT_EXCEEDED', { action: 'declare_war' })
    return { error: 'Too many military actions — please slow down and try again in a few seconds.' }
  }

  const { error } = await supabase.rpc('declare_war', {
    p_attacker_id: attackerNationId,
    p_defender_id: defenderNationId,
  })

  if (error) {
    await logAudit(user.id, attackerNationId, ip, 'ACTION_FAILED', { action: 'declare_war', error: error.message })
    return { error: error.message }
  }

  await logAudit(user.id, attackerNationId, ip, 'ACTION_SUCCESS', { action: 'declare_war', defenderNationId })
  return { success: true }
}

export async function dispatchAttackAction(
  warId: string,
  attackerNationId: string,
  unitType: string,
  amount: number
): Promise<ActionResult> {
  const supabase = await createClient()
  const ip = await getClientIp()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Session not found. Please sign in again.' }

  const allowed = await checkRateLimit(MILITARY_RATE_LIMIT_KEY(user.id), 5, 0.1)
  if (!allowed) {
    await logAudit(user.id, attackerNationId, ip, 'RATE_LIMIT_EXCEEDED', { action: 'dispatch_attack' })
    return { error: 'Too many military actions — please slow down and try again in a few seconds.' }
  }

  const { error } = await supabase.rpc('dispatch_attack', {
    p_war_id: warId,
    p_attacker_nation_id: attackerNationId,
    p_unit_type: unitType,
    p_amount: amount,
  })

  if (error) {
    await logAudit(user.id, attackerNationId, ip, 'ACTION_FAILED', { action: 'dispatch_attack', error: error.message })
    return { error: error.message }
  }

  await logAudit(user.id, attackerNationId, ip, 'ACTION_SUCCESS', { action: 'dispatch_attack', unitType, amount })
  return { success: true }
}