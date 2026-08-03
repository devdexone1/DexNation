# DexNation — Next.js Frontend (Login · Create Nation · Dashboard Shell)

Next.js 15 App Router + TypeScript + Tailwind + Supabase (`@supabase/ssr`).
All player-facing UI text is in English (per File 01: target language is
international English). Code comments and this README are English too.

## Setup

1. **Overwrite/merge this folder into your Next.js project** (safe, since your
   project is still the default boilerplate).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Env vars — **must be named `.env.local`**, not `.env` (Next.js convention):
   ```bash
   cp .env.local.example .env.local
   # then fill in NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
4. Run:
   ```bash
   npm run dev
   ```

## Required Supabase setup

1. **Run the SQL files in this order**, in the Supabase SQL Editor:
   1. `supabase/sql/create_core_tables.sql` — creates `nations`, `governments`,
      `nation_stocks`, `nation_buildings`, `building_types`, seeds the starter
      building catalogue, and enables baseline RLS policies.
   2. `supabase/sql/create_nation_rpc.sql` — the atomic RPC that creates a
      nation + starter pack (File 02 §7), following the RLS rule in File 07
      that `nation_stocks`/`nation_buildings` may only be written via RPC.

   ⚠️ Check the `building_type_id` values (`grain_farm`, `coal_mine`, etc.) —
   make sure they match the `id`s you actually use in `building_types`.

2. **Enable the Google provider**: Supabase Dashboard → Authentication →
   Providers → Google. Fill in the Client ID & Secret from Google Cloud
   Console, then register this redirect URI in Google Console:
   `https://<project-ref>.supabase.co/auth/v1/callback`

3. **Add redirect URLs in Supabase**: Authentication → URL Configuration →
   add `http://localhost:3000/auth/callback` (dev) and your production
   domain later (`https://yourdomain.com/auth/callback`) to "Redirect URLs".

## Why Next.js (instead of plain Vite React)

- **`middleware.ts`** handles ALL redirect logic (not logged in → `/login`,
  logged in but no nation yet → `/create-nation`, has a nation →
  `/dashboard`) at the edge, before the page renders. No "flash" of the
  wrong page like you'd get with a pure client-side SPA.
- **Server Actions** (`app/create-nation/actions.ts`) run the Supabase RPC
  directly on the server, not from the browser — safer for actions that
  mutate important data.
- **Server Components** (dashboard layout & overview) fetch data directly on
  the server, so the first render already has full data, no loading flicker.

## Routing flow

```
/                -> middleware redirect (not logged in -> /login,
                    no nation yet -> /create-nation,
                    has a nation -> /dashboard)
/login           -> Google sign-in
/auth/callback   -> route handler, exchanges auth code for a session
/create-nation   -> only reachable: logged in & no nation yet
/dashboard       -> only reachable: logged in & has a nation
  /dashboard/economy   (placeholder)
  /dashboard/military  (placeholder)
  /dashboard/politics  (placeholder)
  /dashboard/research  (placeholder)
  /dashboard/bank      (placeholder)
  /dashboard/market    (placeholder)
  /dashboard/profile   (placeholder)
```

## Folder structure

```
middleware.ts              auth + nation redirect gating (edge)
app/
  layout.tsx                root layout, loads fonts via next/font
  globals.css                design tokens (File 01) + shared classes (.btn/.card/.input/.badge)
  page.tsx                   fallback root (middleware always redirects away from here)
  login/                     Google sign-in (Client Component)
  auth/callback/route.ts     exchanges OAuth code -> session
  create-nation/
    actions.ts                Server Action -> create_nation RPC
    CreateNationForm.tsx       form (Client Component)
    page.tsx                   Server Component, fetches user, renders the form
  dashboard/
    layout.tsx                Server Component: sidebar + topbar shell
    page.tsx                   Overview (Server Component, real content)
    economy|military|politics|research|bank|market|profile/page.tsx  (placeholders)
components/
  Sidebar.tsx                 left nav (Client Component, usePathname)
  TickClock.tsx                countdown to next Daily Tick 00:00 UTC (Client Component)
  ComingSoon.tsx                reusable placeholder
lib/
  supabase/client.ts           browser client
  supabase/server.ts            server client (Server Components/Actions)
  continent.ts                  fair-random continent assignment (server-side)
  format.ts                     cash/number/percent formatting
types/database.ts               Nation/Government/NationStock types
supabase/sql/
  create_core_tables.sql        run FIRST
  create_nation_rpc.sql          run SECOND
```

## Design notes

Palette & tone follow **File 01** (Swiss Minimalist, cream #FBF9F5, slate ink
#0F172A, amber accent #D96B27, emerald positive #10B981). Numbers use a mono
font (JetBrains Mono, loaded via `next/font`) to feel like an economic
ledger. The signature element is still the "Next Daily Tick" countdown in the
sidebar, derived directly from the 00:00 UTC Daily Tick mechanic in File 05.

## Not built yet (public pages are intentionally NOT used)

Every feature lives behind login, per your call. Economy, Military,
Politics, Research, World Bank, Market, and Profile are still placeholders —
just say when you want to move on to one of them, and I'll read the relevant
spec file first before writing any code.

## Recommended upgrades for later (not implemented here)

- **TanStack Query** for frequently-changing client data (market orders,
  live stock) + a Supabase Realtime channel for live updates without a
  refresh.
- **`supabase gen types typescript`** to generate real types from your
  Postgres schema, replacing the hand-written `types/database.ts`.
- **zod** for input validation in Server Actions before calling the RPC.
