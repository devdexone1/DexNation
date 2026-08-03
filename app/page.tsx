// This route is effectively never rendered for real: middleware.ts always
// redirects "/" to /login, /create-nation, or /dashboard before it gets here.
// Kept as a safe fallback (e.g. if the JS redirect hasn't fired yet).
export default function RootPage() {
  return <div className="screen-loading">Loading DexNation…</div>
}
