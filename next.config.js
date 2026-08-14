/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseHost = supabaseUrl.replace(/^https?:\/\//, '')

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              `img-src 'self' data: https: ${supabaseHost ? `https://${supabaseHost}` : ''}`,
              // FIX: wss:// added — Supabase Realtime (chat, live dashboard updates)
              // connects over WebSocket, not plain HTTPS. Without this, every
              // realtime subscription silently fails to connect.
              `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://accounts.google.com`,
              "frame-src https://accounts.google.com",
              "form-action 'self' https://accounts.google.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig