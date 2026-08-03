import { createClient } from './supabase/server'
import { CONTINENTS, type ContinentId } from '@/types/database'

/**
 * Picks a continent randomly but "fairly":
 * - Count how many nations exist on each continent.
 * - Pick the continent with the FEWEST nations.
 * - If multiple continents are tied for the minimum, pick randomly among them.
 * Called from a Server Action, so the query runs on the server (not the browser).
 */
export async function pickFairContinent(): Promise<ContinentId> {
  const supabase = await createClient()

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
