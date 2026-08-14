'use client'

import { useState, useTransition } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import type { Locale } from '@/lib/i18n/config'
import { createClient } from '@/lib/supabase/client'
import styles from './settings.module.css'

export default function SettingsPageClient({ isAdmin }: { isAdmin: boolean }) {
  const { locale, setLocale, t } = useLanguage()
  const [newsText, setNewsText] = useState('')
  const [newsStatus, setNewsStatus] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSelect(next: Locale) {
    setLocale(next)
    window.location.reload()
  }

  function handlePostNews() {
    setNewsStatus('')
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.rpc('post_news_item', { p_message: newsText })
      setNewsStatus(error ? error.message : 'Posted.')
      if (!error) setNewsText('')
    })
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--color-ink-faint)' }}>
          {t('settings.eyebrow')}
        </div>
        <h1 className={styles.title}>{t('settings.title')}</h1>
        <p className={styles.subtitle}>{t('settings.subtitle')}</p>
      </div>

      <div className={`${styles.section} card`}>
        <div className={styles.sectionTitle}>
          {t('settings.languageTitle')} <span className="badge badge--neutral" style={{ marginLeft: 6 }}>{t('settings.languageBeta')}</span>
        </div>
        <div className={styles.sectionDesc}>{t('settings.languageDesc')}</div>

        <div className={styles.langOptions}>
          <button
            type="button"
            className={`${styles.langCard} ${locale === 'en' ? styles.langCardActive : ''}`}
            onClick={() => handleSelect('en')}
          >
            <div className={styles.langFlag}>🇬🇧</div>
            <div className={styles.langLabel}>{t('settings.english')}</div>
          </button>
          <button
            type="button"
            className={`${styles.langCard} ${locale === 'id' ? styles.langCardActive : ''}`}
            onClick={() => handleSelect('id')}
          >
            <div className={styles.langFlag}>🇮🇩</div>
            <div className={styles.langLabel}>{t('settings.indonesian')}</div>
          </button>
        </div>

        <div className={styles.persistNote}>{t('settings.persistNote')}</div>
      </div>

      {isAdmin ? (
        <div className={`${styles.section} card`}>
          <div className={styles.sectionTitle}>{t('settings.postNewsTitle')}</div>
          <div className={styles.sectionDesc}>{t('settings.postNewsDesc')}</div>
          <div className={styles.newsForm}>
            <input
              className="input"
              placeholder={t('settings.postNewsPlaceholder')}
              value={newsText}
              onChange={(e) => setNewsText(e.target.value)}
            />
            <button type="button" className="btn btn--primary" onClick={handlePostNews} disabled={isPending || !newsText.trim()}>
              {isPending ? t('settings.posting') : t('settings.postNewsButton')}
            </button>
            {newsStatus ? <div style={{ fontSize: 11.5 }}>{newsStatus}</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}