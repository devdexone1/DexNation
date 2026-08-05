'use server'

import { createClient } from '@/lib/supabase/server'
import { getClientIp, logAudit, checkRateLimit } from '@/lib/audit'

interface ActionResult {
  error?: string
  success?: boolean
}

const BANK_RATE_LIMIT_KEY = (userId: string) => `USER_${userId}_ENDPOINT_bank`

export async function applyForLoanAction(
  nationId: string,
  amount: number,
  durationTicks: number
): Promise<ActionResult> {
  const supabase = await createClient()
  const ip = await getClientIp()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session not found. Please sign in again.' }

  const allowed = await checkRateLimit(BANK_RATE_LIMIT_KEY(user.id), 5, 0.1)
  if (!allowed) {
    await logAudit(user.id, nationId, ip, 'RATE_LIMIT_EXCEEDED', { action: 'apply_for_loan' })
    return { error: 'Too many bank actions — please slow down.' }
  }

  const { error } = await supabase.rpc('apply_for_loan', {
    p_nation_id: nationId,
    p_amount: amount,
    p_duration_ticks: durationTicks,
  })
  if (error) {
    await logAudit(user.id, nationId, ip, 'ACTION_FAILED', { action: 'apply_for_loan', error: error.message })
    return { error: error.message }
  }
  await logAudit(user.id, nationId, ip, 'ACTION_SUCCESS', { action: 'apply_for_loan', amount, durationTicks })
  return { success: true }
}

export async function makeLoanPaymentAction(
  nationId: string,
  loanId: string,
  amount: number
): Promise<ActionResult> {
  const supabase = await createClient()
  const ip = await getClientIp()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session not found. Please sign in again.' }

  const allowed = await checkRateLimit(BANK_RATE_LIMIT_KEY(user.id), 5, 0.1)
  if (!allowed) {
    await logAudit(user.id, nationId, ip, 'RATE_LIMIT_EXCEEDED', { action: 'make_loan_payment' })
    return { error: 'Too many bank actions — please slow down.' }
  }

  const { error } = await supabase.rpc('make_loan_payment', {
    p_nation_id: nationId,
    p_loan_id: loanId,
    p_amount: amount,
  })
  if (error) {
    await logAudit(user.id, nationId, ip, 'ACTION_FAILED', { action: 'make_loan_payment', error: error.message })
    return { error: error.message }
  }
  await logAudit(user.id, nationId, ip, 'ACTION_SUCCESS', { action: 'make_loan_payment', loanId, amount })
  return { success: true }
}