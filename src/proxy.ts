import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  // HTTPS(프로덕션)에서는 __Secure- 접두사가 붙음
  const isSecure = req.url.startsWith('https://')
  const cookieName = isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token'

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName,
  })

  if (!token) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    '/((?!login|_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}
