import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId, unauthorized } from '@/lib/session'
import { randomBytes } from 'crypto'

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) return unauthorized()
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { apiToken: true } })
  return NextResponse.json({ token: user?.apiToken ?? null })
}

export async function POST() {
  const userId = await getSessionUserId()
  if (!userId) return unauthorized()
  const token = randomBytes(32).toString('hex')
  await prisma.user.update({ where: { id: userId }, data: { apiToken: token } })
  return NextResponse.json({ token })
}

export async function DELETE() {
  const userId = await getSessionUserId()
  if (!userId) return unauthorized()
  await prisma.user.update({ where: { id: userId }, data: { apiToken: null } })
  return NextResponse.json({ ok: true })
}
