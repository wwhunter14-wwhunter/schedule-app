import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(tags)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name } = body

  if (!name) {
    return NextResponse.json({ error: '태그 이름이 필요합니다' }, { status: 400 })
  }

  const tag = await prisma.tag.create({ data: { name } })
  return NextResponse.json(tag, { status: 201 })
}
