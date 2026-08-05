import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'

export async function getClientIp(): Promise<string> {
  const headersList = await headers()
  return headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

export async function logAudit(
  userId: string | null,
  nationId: string | null,
  ip: string,
  eventType: string,
  payload: Record<string, unknown>
) {
  const service = createServiceClient()
  await service.from('security_audit_logs').insert({
    user_id: userId,
    nation_id: nationId,
    ip_address: ip,
    event_type: eventType,
    payload,
  })
}

export async function checkRateLimit(
  identifierKey: string,
  capacity: number,
  refillRate: number,
  cost = 1
): Promise<boolean> {
  const service = createServiceClient()
  const { data, error } = await service.rpc('check_rate_limit', {
    p_identifier_key: identifierKey,
    p_capacity: capacity,
    p_refill_rate: refillRate,
    p_cost: cost,
  })
  return !error && !!data
}