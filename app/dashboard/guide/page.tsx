'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageProvider'
import styles from './guide.module.css'

const SURVIVAL_STEPS = [
  {
    title: { en: 'Day 1: Don\'t touch your starting buildings yet', id: 'Hari 1: Jangan utak-atik gedung starter dulu' },
    desc: {
      en: 'You already start with a Grain Farm, Coal Mine, Iron Mine, and Wind Turbine — these are free and already cover your basic Food + raw material needs. Resist the urge to sell them or change anything on day one.',
      id: 'Kamu udah mulai dengan Grain Farm, Coal Mine, Iron Mine, dan Wind Turbine — ini gratis dan udah cukup buat kebutuhan Food + bahan baku dasar. Jangan buru-buru jual atau ubah apa-apa di hari pertama.',
    },
  },
  {
    title: { en: 'Build a Steel Mill before anything else', id: 'Bangun Steel Mill dulu sebelum yang lain' },
    desc: {
      en: 'Your Coal Mine and Iron Mine are already producing Coal and Iron Ore for free every day. A Steel Mill turns that raw output into Steel, which is worth far more and is needed for almost every other building and military unit. This is the single highest-value first purchase.',
      id: 'Coal Mine dan Iron Mine kamu udah otomatis produksi Coal dan Iron Ore tiap hari. Steel Mill ngolah bahan mentah itu jadi Steel, yang nilainya jauh lebih tinggi dan dibutuhin buat hampir semua gedung dan unit militer lain. Ini pembelian pertama paling worth-it.',
    },
  },
  {
    title: { en: 'Sell your surplus raw resources on the Market', id: 'Jual kelebihan bahan mentah di Market' },
    desc: {
      en: 'Once your Steel Mill is running, you\'ll still have leftover Coal/Iron Ore beyond what it consumes. Don\'t let it pile up — list the surplus on the Market for early cash instead of letting your warehouse fill up and pause production.',
      id: 'Begitu Steel Mill jalan, masih ada sisa Coal/Iron Ore yang gak kepake semua. Jangan biarin numpuk — jual kelebihannya di Market buat dapet cash awal, daripada gudang kepenuhan dan produksi malah berhenti.',
    },
  },
  {
    title: { en: 'Keep Approval Rating above 60% at all costs', id: 'Jaga Approval Rating di atas 60% apapun caranya' },
    desc: {
      en: 'Low Approval Rating shrinks your population (below 25% AR) and reduces production output (the AR Multiplier). Build a Textile Factory and Appliance Factory early — Clothing and Home Appliances have the biggest AR impact per unit of demand satisfied.',
      id: 'AR rendah bikin populasi kamu menyusut (di bawah 25% AR) dan produksi turun (kena AR Multiplier). Bangun Textile Factory dan Appliance Factory dari awal — Clothing dan Home Appliances paling berpengaruh ke AR per unit demand yang terpenuhi.',
    },
  },
  {
    title: { en: 'Don\'t recruit military before your economy is stable', id: 'Jangan rekrut militer sebelum ekonomi stabil' },
    desc: {
      en: 'Every unit costs daily upkeep (cash, and sometimes Food/Fuel). Recruiting a large army before your Daily GDP can comfortably cover upkeep will drain your cash reserve fast and can trigger MORALE_ZERO status if you can\'t pay.',
      id: 'Tiap unit ada upkeep harian (cash, kadang Food/Fuel juga). Rekrut pasukan gede-gedean sebelum Daily GDP kamu cukup bakal ngabisin cash cepet banget, dan bisa kena status MORALE_ZERO kalau gak sanggup bayar.',
    },
  },
  {
    title: { en: 'Avoid World Bank loans unless you have a repayment plan', id: 'Hindari pinjaman Bank Dunia kalau belum punya rencana bayar' },
    desc: {
      en: 'Missing 3 loan payments in a row triggers Default: your credit grade drops to F and 20% of your entire stockpile is seized. Only borrow what you can comfortably repay from your Daily GDP.',
      id: 'Telat bayar pinjaman 3x berturut-turut bikin kamu Default: grade kredit anjlok ke F dan 20% seluruh stok kamu disita. Pinjam secukupnya yang bisa kamu bayar dari Daily GDP.',
    },
  },
  {
    title: { en: 'Build a Warehouse Complex once storage keeps filling up', id: 'Bangun Warehouse Complex kalau gudang sering penuh' },
    desc: {
      en: 'If a resource keeps hitting 100% capacity and pausing production, that\'s a sign you need either more storage (Warehouse Complex) or to sell/consume that resource faster — not a sign something is broken.',
      id: 'Kalau ada resource yang sering kena 100% kapasitas dan produksi berhenti, itu tandanya kamu butuh gudang lebih besar (Warehouse Complex) atau jual/pakai resource itu lebih cepat — bukan tanda ada yang rusak.',
    },
  },
]

const PAGE_GUIDES = [
  {
    name: 'Dashboard',
    desc: {
      en: 'Your nation\'s home screen — cash, population, Approval Rating, Daily GDP, warehouse levels, your buildings, and any alerts that need your attention (like nearly-full storage).',
      id: 'Halaman utama negara kamu — cash, populasi, Approval Rating, Daily GDP, level gudang, gedung kamu, dan alert yang butuh perhatian (misal gudang hampir penuh).',
    },
    available: true,
  },
  {
    name: 'Economy',
    desc: {
      en: 'Construct new buildings across 5 categories (Extraction, Processing, High-Tech, Energy, Medical). Buildings produce resources automatically every Day based on your Approval Rating and available inputs.',
      id: 'Bangun gedung baru dari 5 kategori (Extraction, Processing, High-Tech, Energy, Medical). Gedung produksi resource otomatis tiap hari, tergantung Approval Rating dan bahan yang tersedia.',
    },
    available: true,
  },
  // ...lanjutkan pola yang sama buat 9 item sisanya (Military, Research, World Bank, Market, Politics, Profile, Leaderboard, Statistics, Inventory)
]

export default function GuidePage() {
  const [tab, setTab] = useState<'survival' | 'pages'>('survival')
  const { locale, t } = useLanguage()

  return (
    <div>
      <div className={styles.header}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--color-ink-faint)' }}>
          Guide
        </div>
        <h1 className={styles.title}>How to Play</h1>
        <p className={styles.subtitle}>
          A quick reference for keeping your nation stable, plus a breakdown of what each
          page in the game does.
        </p>
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'survival' ? styles.tabActive : ''}`}
          onClick={() => setTab('survival')}
        >
          Survival Basics
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'pages' ? styles.tabActive : ''}`}
          onClick={() => setTab('pages')}
        >
          Page-by-Page Guide
        </button>
      </div>

      {tab === 'survival' ? (
        <div className={`${styles.panel} card`}>
          <div className={styles.stepList}>
            {SURVIVAL_STEPS.map((step, i) => (
              <div className={styles.step} key={i}>
                <div className={styles.stepNum}>{i + 1}</div>
                <div>
                  <div className={styles.stepTitle}>{step.title[locale]}</div>
                  <div className={styles.stepDesc}>{step.desc[locale]}</div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.warnBox}>
            Every Day (00:00 UTC), your nation automatically: consumes Food/Consumer
            Goods and updates Approval Rating, runs production in every active building,
            pays military upkeep, collects tax revenue, services any active loans, and
            heals injured troops if you have a hospital. Nothing here requires you to be
            online — it all happens on its own.
          </div>
        </div>
      ) : (
        <div className={styles.pageGrid}>
          {PAGE_GUIDES.map((p) => (
            <div className={`${styles.pageCard} card`} key={p.name}>
              <div className={styles.pageCardName}>
                {p.name}
                {!p.available ? <span className="badge badge--neutral" style={{ marginLeft: 8 }}>Coming Soon</span> : null}
              </div>
              <div className={styles.pageCardDesc}>{p.desc[locale]}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}