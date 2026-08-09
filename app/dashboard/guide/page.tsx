'use client'

import { useState } from 'react'
import styles from './guide.module.css'

const SURVIVAL_STEPS = [
  {
    title: 'Day 1: Don\'t touch your starting buildings yet',
    desc: 'You already start with a Grain Farm, Coal Mine, Iron Mine, and Wind Turbine — these are free and already cover your basic Food + raw material needs. Resist the urge to sell them or change anything on day one.',
  },
  {
    title: 'Build a Steel Mill before anything else',
    desc: 'Your Coal Mine and Iron Mine are already producing Coal and Iron Ore for free every day. A Steel Mill turns that raw output into Steel, which is worth far more and is needed for almost every other building and military unit. This is the single highest-value first purchase.',
  },
  {
    title: 'Sell your surplus raw resources on the Market',
    desc: 'Once your Steel Mill is running, you\'ll still have leftover Coal/Iron Ore beyond what it consumes. Don\'t let it pile up — list the surplus on the Market for early cash instead of letting your warehouse fill up and pause production.',
  },
  {
    title: 'Keep Approval Rating above 60% at all costs',
    desc: 'Low Approval Rating shrinks your population (below 25% AR) and reduces production output (the AR Multiplier). Build a Textile Factory and Appliance Factory early — Clothing and Home Appliances have the biggest AR impact per unit of demand satisfied.',
  },
  {
    title: 'Don\'t recruit military before your economy is stable',
    desc: 'Every unit costs daily upkeep (cash, and sometimes Food/Fuel). Recruiting a large army before your Daily GDP can comfortably cover upkeep will drain your cash reserve fast and can trigger MORALE_ZERO status if you can\'t pay.',
  },
  {
    title: 'Avoid World Bank loans unless you have a repayment plan',
    desc: 'Missing 3 loan payments in a row triggers Default: your credit grade drops to F and 20% of your entire stockpile is seized. Only borrow what you can comfortably repay from your Daily GDP.',
  },
  {
    title: 'Build a Warehouse Complex once storage keeps filling up',
    desc: 'If a resource keeps hitting 100% capacity and pausing production, that\'s a sign you need either more storage (Warehouse Complex) or to sell/consume that resource faster — not a sign something is broken.',
  },
]

const PAGE_GUIDES = [
  {
    name: 'Dashboard',
    desc: 'Your nation\'s home screen — cash, population, Approval Rating, Daily GDP, warehouse levels, your buildings, and any alerts that need your attention (like nearly-full storage).',
    available: true,
  },
  {
    name: 'Economy',
    desc: 'Construct new buildings across 5 categories (Extraction, Processing, High-Tech, Energy, Medical). Buildings produce resources automatically every Day based on your Approval Rating and available inputs.',
    available: true,
  },
  {
    name: 'Military',
    desc: 'Recruit Land/Air/Naval units, view active wars, dispatch troops to attack, and manage naval blockades. Combat resolves in real time — sent troops travel, then fight a 60-second battle once they arrive.',
    available: true,
  },
  {
    name: 'Research',
    desc: 'Queue up technologies across 4 branches (Industrial, Military, Economic, Energy). Research Points accumulate automatically from Research buildings and population, and flow into whatever is at the top of your queue.',
    available: true,
  },
  {
    name: 'World Bank',
    desc: 'Check your credit score and grade, apply for loans (capped by your grade), and make repayments. Daily interest and principal are deducted automatically from your cash each day.',
    available: true,
  },
  {
    name: 'Market',
    desc: 'List resources for sale or buy from other nations. Cross-continent trades take longer to arrive and cost Fuel; same-continent trades are faster and free. Watch for active naval blockades — they can intercept your shipments.',
    available: true,
  },
  {
    name: 'Politics',
    desc: 'Reform your government\'s ideology, create or join an Alliance, propose FTA trade treaties with other alliances, vote on UN Resolutions, and search for other nations.',
    available: true,
  },
  {
    name: 'Profile',
    desc: 'Your account info, nation rename, flag upload with frame styles, and your nation\'s lifetime stats (buildings, units, tech, trades).',
    available: true,
  },
  {
    name: 'Leaderboard',
    desc: 'Rankings by GDP, military strength, and research progress.',
    available: false,
  },
  {
    name: 'Statistics',
    desc: 'Server-wide economic and military statistics, trends, and charts.',
    available: false,
  },
  {
    name: 'Inventory',
    desc: 'A shop and inventory system for special items with unique gameplay effects.',
    available: false,
  },
]

export default function GuidePage() {
  const [tab, setTab] = useState<'survival' | 'pages'>('survival')

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
                  <div className={styles.stepTitle}>{step.title}</div>
                  <div className={styles.stepDesc}>{step.desc}</div>
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
              <div className={styles.pageCardDesc}>{p.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}