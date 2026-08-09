export const locales = ['en', 'id'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
export const LOCALE_COOKIE_NAME = 'dexnation_locale'