import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId, unauthorized } from '@/lib/session'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId()
  if (!userId) return unauthorized()

  const { id } = await params
  const { name, color } = await request.json()

  const category = await prisma.category.update({
    where: { id: parseInt(id), userId },
    data: { name, color },
  })
  return NextResponse.json(category)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId()
  if (!userId) return unauthorized()

  const { id } = await params
  await prisma.category.delete({ where: { id: parseInt(id), userId } })
  return new NextResponse(null, { status: 204 })
}
