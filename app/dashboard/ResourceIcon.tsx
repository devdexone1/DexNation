const RAW_RESOURCES = new Set(['Food', 'Coal', 'Iron Ore', 'Crude Oil', 'Rare Earths'])
const ENERGY_RESOURCES = new Set(['Fuel', 'Electricity'])
const PROCESSED_RESOURCES = new Set(['Steel', 'Maintenance Kit'])
const CONSUMER_RESOURCES = new Set(['Clothing', 'Home Appliances', 'Electronics'])
// Anything else (Microchips, Advanced Composites, Weapons Grade Steel) falls into HIGH_TECH.

export default function ResourceIcon({ resourceType }: { resourceType: string }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6 }

  if (RAW_RESOURCES.has(resourceType)) {
    return (
      <svg {...common}>
        <path d="M4 20L14 6l6 4-10 10H4v-2z" strokeLinejoin="round" />
      </svg>
    )
  }
  if (ENERGY_RESOURCES.has(resourceType)) {
    return (
      <svg {...common}>
        <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" strokeLinejoin="round" />
      </svg>
    )
  }
  if (PROCESSED_RESOURCES.has(resourceType)) {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      </svg>
    )
  }
  if (CONSUMER_RESOURCES.has(resourceType)) {
    return (
      <svg {...common}>
        <rect x="4" y="8" width="16" height="12" rx="1" />
        <path d="M8 8V6a4 4 0 0 1 8 0v2" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <rect x="6" y="6" width="12" height="12" rx="1" />
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
    </svg>
  )
}