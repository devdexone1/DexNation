import { createClient } from '@/lib/supabase/server'
import SettingsPageClient from './SettingsPageClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data } = await supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
    isAdmin = !!data
  }

  return <SettingsPageClient isAdmin={isAdmin} />
}