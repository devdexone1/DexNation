'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { LOCALE_COOKIE_NAME, type Locale } from './config'
import { dictionaries, getNested } from './dictionaries'

interface LanguageContextValue {
  locale: Locale
  t: (key: string) => string
  setLocale: (next: Locale) => void
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: React.ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    const secureFlag = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${LOCALE_COOKIE_NAME}=${next}; path=/; max-age=31536000; SameSite=Lax${secureFlag}`
  }, [])

  const t = useCallback((key: string) => getNested(dictionaries[locale], key), [locale])

  return <LanguageContext.Provider value={{ locale, t, setLocale }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return ctx
}