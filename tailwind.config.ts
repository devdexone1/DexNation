import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#fbf9f5',
        surface: '#ffffff',
        'surface-sunken': '#f4f1ea',
        ink: '#0f172a',
        accent: '#d96b27',
        positive: '#10b981',
        negative: '#be3a34',
        warning: '#c98a1f',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        sm: '3px',
        md: '6px',
      },
    },
  },
  plugins: [],
}

export default config
