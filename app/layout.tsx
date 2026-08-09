import type { Metadata } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
// @ts-ignore: Next.js loads the global stylesheet at runtime.
import './globals.css'
import { getServerLocale } from '@/lib/i18n/getServerLocale'
import { LanguageProvider } from '@/lib/i18n/LanguageProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'DexNation',
  description: 'Build your industry, control the market, and lead your nation.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale()

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
      </body>
    </html>
  )
}
