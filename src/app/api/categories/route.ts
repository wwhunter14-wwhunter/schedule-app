import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(categories)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, color } = body

  if (!name) {
    return NextResponse.json({ error: '카테고리 이름이 필요합니다' }, { status: 400 })
  }

  const category = await prisma.category.create({
    data: { name, color: color ?? '#6366f1' },
  })
  return NextResponse.json(category, { status: 201 })
}
