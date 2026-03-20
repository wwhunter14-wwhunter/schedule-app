import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const now = new Date()
  const soon = new Date(now.getTime() + 70_000)

  const due = await prisma.schedule.findMany({
    where: {
      notifyAt: { gte: now, lte: soon },
    },
    select: {
      id: true,
      title: true,
      startAt: true,
      notifyAt: true,
    },
  })

  return NextResponse.json(due)
}
