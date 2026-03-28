import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(req: NextRequest) {
  const isSecure = req.url.startsWith('https://')
  const cookieName = isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token'

  const token = await getToken({ req, secret: process.env.AUTH_SECRET, cookieName })

  if (!token) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: ['/((?!login|register|_next/static|_next/image|favicon.ico|api/auth|api/import|api/telegram).*)',],
}
