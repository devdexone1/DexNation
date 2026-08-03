import { createClient } from '@/lib/supabase/server'
import CreateNationForm from './CreateNationForm'

export default async function CreateNationPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <CreateNationForm userEmail={user?.email ?? null} />
}
