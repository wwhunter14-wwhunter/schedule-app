import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId, unauthorized } from '@/lib/session'

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) return unauthorized()

  const now = new Date()
  const soon = new Date(now.getTime() + 70_000)

  const due = await prisma.schedule.findMany({
    where: { userId, notifyAt: { gte: now, lte: soon } },
    select: { id: true, title: true, startAt: true, notifyAt: true },
  })

  return NextResponse.json(due)
}
