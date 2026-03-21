import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId, unauthorized } from '@/lib/session'

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) return unauthorized()

  const tags = await prisma.tag.findMany({ where: { userId }, orderBy: { name: 'asc' } })
  return NextResponse.json(tags)
}

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return unauthorized()

  const { name } = await request.json()
  if (!name) return NextResponse.json({ error: '태그 이름이 필요합니다' }, { status: 400 })

  const tag = await prisma.tag.create({ data: { name, userId } })
  return NextResponse.json(tag, { status: 201 })
}
