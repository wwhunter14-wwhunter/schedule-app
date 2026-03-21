import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function getSessionUserId(): Promise<number | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  return parseInt(session.user.id)
}

export function unauthorized() {
  return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
}
