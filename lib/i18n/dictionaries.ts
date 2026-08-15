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

  if (typeof result === 'string') return result

  // FIX (BUG-007): sebelumnya key yang typo/gak ketemu diam-diam nampilin
  // string key mentah ke pemain tanpa indikasi apa pun. Sekarang di mode
  // development, muncul warning di Console — biar typo ketauan pas develop,
  // bukan pas udah kepublish.
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[i18n] Missing translation key: "${path}"`)
  }
  return path
}