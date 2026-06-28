import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('arkan_session')?.value
  const { pathname } = request.nextUrl

  // Identify pages to protect
  const isDashboardPath = pathname.startsWith('/dashboard')
  const isLoginPath = pathname === '/login'

  if (isDashboardPath) {
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (isLoginPath) {
    if (token) {
      const dashboardUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(dashboardUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
  ],
}
