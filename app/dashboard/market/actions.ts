'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getClientIp, logAudit, checkRateLimit } from '@/lib/audit'

interface ActionResult {
  error?: string
  success?: boolean
}

export async function createSellOrderAction(
  nationId: string,
  resourceType: string,
  unitPriceCash: number,
  quantity: number
): Promise<ActionResult> {
  const supabase = await createClient()
  const ip = await getClientIp()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Session not found. Please sign in again.' }
  }

  const allowed = await checkRateLimit(`USER_${user.id}_ENDPOINT_market`, 10, 0.5)

  if (!allowed) {
    await logAudit(user.id, nationId, ip, 'RATE_LIMIT_EXCEEDED', { action: 'create_sell_order' })
    return { error: 'Too many market actions — please slow down and try again in a few seconds.' }
  }

  const { error } = await supabase.rpc('create_sell_order', {
    p_nation_id: nationId,
    p_resource_type: resourceType,
    p_unit_price_cash: unitPriceCash,
    p_quantity: quantity,
  })

  if (error) {
    await logAudit(user.id, nationId, ip, 'ACTION_FAILED', { action: 'create_sell_order', error: error.message })
    return { error: error.message }
  }

  await logAudit(user.id, nationId, ip, 'ACTION_SUCCESS', { action: 'create_sell_order', resourceType, quantity })
  return { success: true }
}

export async function buyMarketOrderAction(
  nationId: string,
  orderId: string,
  quantity: number
): Promise<ActionResult> {
  const supabase = await createClient()
  const ip = await getClientIp()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Session not found. Please sign in again.' }
  }

  const allowed = await checkRateLimit(`USER_${user.id}_ENDPOINT_market`, 10, 0.5)

  if (!allowed) {
    await logAudit(user.id, nationId, ip, 'RATE_LIMIT_EXCEEDED', { action: 'buy_market_order' })
    return { error: 'Too many market actions — please slow down and try again in a few seconds.' }
  }

  const { error } = await supabase.rpc('buy_market_order', {
    p_buyer_nation_id: nationId,
    p_order_id: orderId,
    p_quantity: quantity,
  })

  if (error) {
    await logAudit(user.id, nationId, ip, 'ACTION_FAILED', { action: 'buy_market_order', error: error.message })
    return { error: error.message }
  }

  await logAudit(user.id, nationId, ip, 'ACTION_SUCCESS', { action: 'buy_market_order', orderId, quantity })
  return { success: true }
}

export async function cancelSellOrderAction(nationId: string, orderId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const ip = await getClientIp()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Session not found. Please sign in again.' }
  }

  const { error } = await supabase.rpc('cancel_sell_order', {
    p_nation_id: nationId,
    p_order_id: orderId,
  })

  if (error) {
    await logAudit(user.id, nationId, ip, 'ACTION_FAILED', { action: 'cancel_sell_order', error: error.message })
    return { error: error.message }
  }

  await logAudit(user.id, nationId, ip, 'ACTION_SUCCESS', { action: 'cancel_sell_order', orderId })
  return { success: true }
}