import en from '@/locales/en.json'
import id from '@/locales/id.json'
import type { Locale } from './config'

export const dictionaries: Record<Locale, typeof en> = { en, id }

export function getNested(obj: unknown, path: string): string {
  const result = path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, obj)
  return typeof result === 'string' ? result : path
}