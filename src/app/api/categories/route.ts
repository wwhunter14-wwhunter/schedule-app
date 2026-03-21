import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId, unauthorized } from '@/lib/session'

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) return unauthorized()

  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(categories)
}

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return unauthorized()

  const { name, color } = await request.json()
  if (!name) return NextResponse.json({ error: '카테고리 이름이 필요합니다' }, { status: 400 })

  const category = await prisma.category.create({
    data: { name, color: color ?? '#6366f1', userId },
  })
  return NextResponse.json(category, { status: 201 })
}
