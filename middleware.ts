import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip if Supabase not configured yet
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const protectedPrefixes = ['/owner', '/company', '/chat']
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p))

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && (pathname === '/login' || pathname === '/register')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profile) {
      if (!profile.onboarding_completed) {
        return NextResponse.redirect(
          new URL(`/${profile.role}/onboarding`, request.url)
        )
      }
      return NextResponse.redirect(
        new URL(`/${profile.role}/dashboard`, request.url)
      )
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
