'use server'

import { createClient } from '@/lib/supabase/server'
import { getClientIp, logAudit, checkRateLimit } from '@/lib/audit'

interface ActionResult {
  error?: string
  success?: boolean
}

export async function sendChatMessageAction(scope: 'GLOBAL' | 'CONTINENT', message: string): Promise<ActionResult> {
  const supabase = await createClient()
  const ip = await getClientIp()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Session not found. Please sign in again.' }

  const allowed = await checkRateLimit(`USER_${user.id}_ENDPOINT_chat`, 5, 0.5)
  if (!allowed) {
    await logAudit(user.id, null, ip, 'RATE_LIMIT_EXCEEDED', { action: 'send_chat_message' })
    return { error: 'You are sending messages too fast.' }
  }

  const { error } = await supabase.rpc('send_chat_message', { p_scope: scope, p_message: message })
  if (error) {
    return { error: error.message }
  }
  return { success: true }
}

export async function reportChatMessageAction(messageId: string, reason: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('report_chat_message', {
    p_message_id: messageId,
    p_reason: reason,
  })
  if (error) return { error: error.message }
  return { success: true }
}