import { cookies } from 'next/headers'
import { defaultLocale, locales, LOCALE_COOKIE_NAME, type Locale } from './config'
import { dictionaries, getNested } from './dictionaries'

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const value = cookieStore.get(LOCALE_COOKIE_NAME)?.value
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale
}

export async function getServerTranslator() {
  const locale = await getServerLocale()
  return (key: string) => getNested(dictionaries[locale], key)
}