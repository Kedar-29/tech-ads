import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './lib/jwt'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const user = token ? verifyToken(token) : null
  const path = req.nextUrl.pathname

  // Unauthenticated access
  if (!user && !path.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Role-based protection
  if (user) {
    if (path.startsWith('/master') && user.role !== 'MASTER') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    if (path.startsWith('/agency') && user.role !== 'AGENCY') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    if (path.startsWith('/client') && user.role !== 'AGENCY_CLIENT') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/master/:path*', '/agency/:path*', '/client/:path*', '/login'],
}
