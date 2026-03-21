import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId, unauthorized } from '@/lib/session'

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId()
  if (!userId) return unauthorized()

  const { id } = await params
  await prisma.tag.delete({ where: { id: parseInt(id), userId } })
  return new NextResponse(null, { status: 204 })
}
