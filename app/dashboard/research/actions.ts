'use server'

import { createClient } from '@/lib/supabase/server'
import { getClientIp, logAudit, checkRateLimit } from '@/lib/audit'

interface ActionResult {
  error?: string
  success?: boolean
}

const RESEARCH_RATE_LIMIT_KEY = (userId: string) => `USER_${userId}_ENDPOINT_research`

export async function queueResearchAction(nationId: string, techId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const ip = await getClientIp()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session not found. Please sign in again.' }

  const allowed = await checkRateLimit(RESEARCH_RATE_LIMIT_KEY(user.id), 10, 0.2)
  if (!allowed) {
    await logAudit(user.id, nationId, ip, 'RATE_LIMIT_EXCEEDED', { action: 'queue_research' })
    return { error: 'Too many research actions — please slow down.' }
  }

  const { error } = await supabase.rpc('queue_research', { p_nation_id: nationId, p_tech_id: techId })
  if (error) {
    await logAudit(user.id, nationId, ip, 'ACTION_FAILED', { action: 'queue_research', error: error.message })
    return { error: error.message }
  }
  await logAudit(user.id, nationId, ip, 'ACTION_SUCCESS', { action: 'queue_research', techId })
  return { success: true }
}

export async function dequeueResearchAction(nationId: string, techId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const ip = await getClientIp()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session not found. Please sign in again.' }

  const allowed = await checkRateLimit(RESEARCH_RATE_LIMIT_KEY(user.id), 10, 0.2)
  if (!allowed) {
    await logAudit(user.id, nationId, ip, 'RATE_LIMIT_EXCEEDED', { action: 'dequeue_research' })
    return { error: 'Too many research actions — please slow down.' }
  }

  const { error } = await supabase.rpc('dequeue_research', { p_nation_id: nationId, p_tech_id: techId })
  if (error) {
    await logAudit(user.id, nationId, ip, 'ACTION_FAILED', { action: 'dequeue_research', error: error.message })
    return { error: error.message }
  }
  await logAudit(user.id, nationId, ip, 'ACTION_SUCCESS', { action: 'dequeue_research', techId })
  return { success: true }
}