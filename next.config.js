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
          // Prevent clickjacking: don't let this site be embedded in an iframe elsewhere.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Stop browsers from "sniffing" content types (mitigates some XSS vectors).
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Don't leak full URLs (with query params) to third-party sites via Referer header.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable browser features this app never uses.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Force HTTPS for a full year, including subdomains (no-op on localhost).
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              `img-src 'self' data: https: ${supabaseHost ? `https://${supabaseHost}` : ''}`,
              `connect-src 'self' https://${supabaseHost} https://accounts.google.com`,
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