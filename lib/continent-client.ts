import { createClient } from './supabase/client'
import { CONTINENTS, type ContinentId } from '@/types/database'

// Client-side version of the fair continent picker — called directly from
// the browser instead of through a Server Action.
export async function pickFairContinentClient(): Promise<ContinentId> {
  const supabase = createClient()

  const counts = await Promise.all(
    CONTINENTS.map(async (continentId) => {
      const { count, error } = await supabase
        .from('nations')
        .select('id', { count: 'exact', head: true })
        .eq('continent_id', continentId)

      if (error) {
        console.error(`[DexNation] Failed to count population for ${continentId}:`, error.message)
        return { id: continentId, count: 0 }
      }
      return { id: continentId, count: count ?? 0 }
    })
  )

  const minCount = Math.min(...counts.map((c) => c.count))
  const candidates = counts.filter((c) => c.count === minCount)
  return candidates[Math.floor(Math.random() * candidates.length)].id
}