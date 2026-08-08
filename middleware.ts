import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isLoginRoute = path === '/login'
  const isCreateNationRoute = path.startsWith('/create-nation')
  const isDashboardRoute = path.startsWith('/dashboard')
  const isAdminRoute = path.startsWith('/admin')
  const isBannedRoute = path.startsWith('/banned')
  const isRoot = path === '/'
  const isAuthCallback = path.startsWith('/auth/callback')

  if (isAuthCallback) {
    return response
  }

  if (!user && (isCreateNationRoute || isDashboardRoute || isAdminRoute || isRoot)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    // Ban check applies to every protected route, before anything else.
    const { data: activeBan } = await supabase
      .from('bans')
      .select('banned_until')
      .eq('user_id', user.id)
      .gt('banned_until', new Date().toISOString())
      .order('banned_until', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (activeBan && !isBannedRoute && !isLoginRoute) {
      return NextResponse.redirect(new URL('/banned', request.url))
    }
    if (!activeBan && isBannedRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (isAdminRoute) {
      const { data: adminRow } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!adminRow) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return response
    }

    if (isLoginRoute || isCreateNationRoute || isDashboardRoute || isRoot) {
      const { data: nation } = await supabase
        .from('nations')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (isLoginRoute) {
        return NextResponse.redirect(
          new URL(nation ? '/dashboard' : '/create-nation', request.url)
        )
      }
      if (isRoot) {
        return NextResponse.redirect(
          new URL(nation ? '/dashboard' : '/create-nation', request.url)
        )
      }
      if (isCreateNationRoute && nation) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      if (isDashboardRoute && !nation) {
        return NextResponse.redirect(new URL('/create-nation', request.url))
      }
    }
  } else if (isBannedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}