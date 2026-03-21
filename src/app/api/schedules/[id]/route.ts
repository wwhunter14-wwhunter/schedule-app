import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUserId, unauthorized } from '@/lib/session'
import type { CreateScheduleInput } from '@/lib/types'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId()
  if (!userId) return unauthorized()

  const { id } = await params
  const schedule = await prisma.schedule.findUnique({
    where: { id: parseInt(id), userId },
    include: { category: true, recurringRule: true, tags: { include: { tag: true } } },
  })

  if (!schedule) return NextResponse.json({ error: '일정을 찾을 수 없습니다' }, { status: 404 })
  return NextResponse.json(schedule)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId()
  if (!userId) return unauthorized()

  const { id } = await params
  const scheduleId = parseInt(id)
  const body: Partial<CreateScheduleInput> = await request.json()

  const existing = await prisma.schedule.findUnique({
    where: { id: scheduleId, userId },
    include: { recurringRule: true },
  })
  if (!existing) return NextResponse.json({ error: '일정을 찾을 수 없습니다' }, { status: 404 })

  const startAt = body.startAt ? new Date(body.startAt) : existing.startAt
  const notifyMinutes = body.notifyMinutes !== undefined ? body.notifyMinutes : existing.notifyMinutes
  const notifyAt = notifyMinutes != null
    ? new Date(startAt.getTime() - notifyMinutes * 60 * 1000)
    : null

  let recurringRuleId = existing.recurringRuleId
  if (body.recurring) {
    if (recurringRuleId) {
      await prisma.recurringRule.update({
        where: { id: recurringRuleId },
        data: {
          frequency: body.recurring.frequency,
          interval: body.recurring.interval ?? 1,
          daysOfWeek: body.recurring.daysOfWeek ?? null,
          endDate: body.recurring.endDate ? new Date(body.recurring.endDate) : null,
          count: body.recurring.count ?? null,
        },
      })
    } else {
      const rule = await prisma.recurringRule.create({
        data: {
          frequency: body.recurring.frequency,
          interval: body.recurring.interval ?? 1,
          daysOfWeek: body.recurring.daysOfWeek ?? null,
          endDate: body.recurring.endDate ? new Date(body.recurring.endDate) : null,
          count: body.recurring.count ?? null,
        },
      })
      recurringRuleId = rule.id
    }
  }

  if (body.tagIds !== undefined) {
    await prisma.scheduleTag.deleteMany({ where: { scheduleId } })
  }

  const schedule = await prisma.schedule.update({
    where: { id: scheduleId, userId },
    data: {
      title: body.title,
      description: body.description,
      memo: body.memo,
      attachmentName: body.attachmentName,
      attachmentPath: body.attachmentPath,
      startAt: body.startAt ? new Date(body.startAt) : undefined,
      endAt: body.endAt ? new Date(body.endAt) : undefined,
      allDay: body.allDay,
      color: body.color,
      notifyMinutes,
      notifyAt,
      isRecurring: body.recurring !== undefined ? !!body.recurring : existing.isRecurring,
      categoryId: body.categoryId,
      recurringRuleId,
      tags: body.tagIds ? { create: body.tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
    include: { category: true, recurringRule: true, tags: { include: { tag: true } } },
  })

  return NextResponse.json(schedule)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId()
  if (!userId) return unauthorized()

  const { id } = await params
  await prisma.schedule.delete({ where: { id: parseInt(id), userId } })
  return new NextResponse(null, { status: 204 })
}
