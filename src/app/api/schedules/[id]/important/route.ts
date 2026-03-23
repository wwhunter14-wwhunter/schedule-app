import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId, unauthorized } from '@/lib/session'

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId()
  if (!userId) return unauthorized()

  const { id } = await params
  const schedule = await prisma.schedule.findUnique({ where: { id: parseInt(id), userId } })
  if (!schedule) return NextResponse.json({ error: '일정을 찾을 수 없습니다' }, { status: 404 })

  const updated = await prisma.schedule.update({
    where: { id: parseInt(id), userId },
    data: { isImportant: !schedule.isImportant },
  })

  return NextResponse.json({ isImportant: updated.isImportant })
}
