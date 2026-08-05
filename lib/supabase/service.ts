import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service-role client — ONLY used inside Server Actions (never sent to the
// browser). Bypasses RLS entirely, needed to write to rate_limit_buckets
// and security_audit_logs, which have zero client-facing grants on purpose.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}