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

  // REQUIRED: refresh the Supabase session token on every request (official @supabase/ssr pattern)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isLoginRoute = path === '/login'
  const isCreateNationRoute = path.startsWith('/create-nation')
  const isDashboardRoute = path.startsWith('/dashboard')
  const isRoot = path === '/'
  const isAuthCallback = path.startsWith('/auth/callback')

  if (isAuthCallback) {
    return response
  }

  // Not logged in but trying to access a route that requires auth -> send to /login
  if (!user && (isCreateNationRoute || isDashboardRoute || isRoot)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logged in -> decide destination based on whether the player already has a nation
  if (user && (isLoginRoute || isCreateNationRoute || isDashboardRoute || isRoot)) {
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

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
