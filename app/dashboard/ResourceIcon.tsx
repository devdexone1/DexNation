const ICONS: Record<string, JSX.Element> = {
  Food: <path d="M4 20L14 6l6 4-10 10H4v-2z" strokeLinejoin="round" />,
  Coal: <><rect x="5" y="10" width="14" height="9" rx="1" /><path d="M8 10V6h8v4" /></>,
  'Iron Ore': <path d="M12 3l8 5-2 10-6 3-6-3-2-10 8-5z" strokeLinejoin="round" />,
  'Crude Oil': <><path d="M12 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9z" /></>,
  'Rare Earths': <><path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.5L12 14.7 7.1 17.2l.9-5.5-4-3.9L9.5 7 12 2z" /></>,
  Fuel: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" strokeLinejoin="round" />,
  Steel: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></>,
  'Maintenance Kit': <><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M9 7V5a3 3 0 0 1 6 0v2" /><path d="M12 11v4M10 13h4" /></>,
  Clothing: <><rect x="4" y="8" width="16" height="12" rx="1" /><path d="M8 8V6a4 4 0 0 1 8 0v2" /></>,
  'Home Appliances': <><rect x="5" y="4" width="14" height="16" rx="1" /><circle cx="12" cy="14" r="3" /><path d="M7 7h2M11 7h2" /></>,
  Electronics: <><rect x="6" y="6" width="12" height="12" rx="1" /><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" /></>,
  Microchips: <><rect x="7" y="7" width="10" height="10" rx="1" /><path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4" /></>,
  'Advanced Composites': <><path d="M4 7l8-4 8 4v10l-8 4-8-4V7z" strokeLinejoin="round" /><path d="M4 7l8 4 8-4M12 11v10" strokeLinejoin="round" /></>,
  'Weapons Grade Steel': <><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" strokeLinejoin="round" /></>,
}

export default function ResourceIcon({ resourceType }: { resourceType: string }) {
  const path = ICONS[resourceType]
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      {path ?? <rect x="6" y="6" width="12" height="12" rx="1" />}
    </svg>
  )
}