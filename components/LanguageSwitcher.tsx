'use client'

import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import type { Locale } from '@/lib/i18n/config'
import styles from './LanguageSwitcher.module.css'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()
  const router = useRouter()

  function handleChange(next: Locale) {
    setLocale(next)
    // Server Components only re-read the locale cookie on navigation/refresh.
    router.refresh()
  }

  return (
    <div className={styles.switcher}>
      <button
        type="button"
        className={`${styles.option} ${locale === 'en' ? styles.optionActive : ''}`}
        onClick={() => handleChange('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={`${styles.option} ${locale === 'id' ? styles.optionActive : ''}`}
        onClick={() => handleChange('id')}
      >
        ID
      </button>
    </div>
  )
}