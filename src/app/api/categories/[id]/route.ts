import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { name, color } = body

  const category = await prisma.category.update({
    where: { id: parseInt(id) },
    data: { name, color },
  })
  return NextResponse.json(category)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.category.delete({ where: { id: parseInt(id) } })
  return new NextResponse(null, { status: 204 })
}
