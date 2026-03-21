import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { CreateScheduleInput } from '@/lib/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const categoryId = searchParams.get('categoryId')
  const tagId = searchParams.get('tagId')
  const q = searchParams.get('q')

  const where: Prisma.ScheduleWhereInput = {}

  if (from && to) {
    where.OR = [
      { startAt: { gte: new Date(from), lte: new Date(to) } },
      { endAt: { gte: new Date(from), lte: new Date(to) } },
      { AND: [{ startAt: { lte: new Date(from) } }, { endAt: { gte: new Date(to) } }] },
      { isRecurring: true },
    ]
  }

  if (categoryId) {
    where.categoryId = parseInt(categoryId)
  }

  if (tagId) {
    where.tags = { some: { tagId: parseInt(tagId) } }
  }

  if (q) {
    const keyword = { contains: q }
    where.OR = [
      ...(Array.isArray(where.OR) ? where.OR : []),
      { title: keyword },
      { description: keyword },
      { memo: keyword },
    ]
  }

  const schedules = await prisma.schedule.findMany({
    where,
    orderBy: { startAt: 'asc' },
    include: {
      category: true,
      recurringRule: true,
      tags: { include: { tag: true } },
    },
  })

  return NextResponse.json(schedules)
}

export async function POST(request: NextRequest) {
  const body: CreateScheduleInput = await request.json()

  if (!body.title || !body.startAt || !body.endAt) {
    return NextResponse.json({ error: '제목, 시작 시간, 종료 시간이 필요합니다' }, { status: 400 })
  }

  const startAt = new Date(body.startAt)
  const endAt = new Date(body.endAt)

  const notifyAt =
    body.notifyMinutes != null
      ? new Date(startAt.getTime() - body.notifyMinutes * 60 * 1000)
      : null

  // Create recurring rule if needed
  let recurringRuleId: number | undefined
  if (body.recurring) {
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

  const schedule = await prisma.schedule.create({
    data: {
      title: body.title,
      description: body.description,
      memo: body.memo,
      attachmentName: body.attachmentName,
      attachmentPath: body.attachmentPath,
      startAt,
      endAt,
      allDay: body.allDay ?? false,
      color: body.color,
      notifyMinutes: body.notifyMinutes,
      notifyAt,
      isRecurring: !!body.recurring,
      categoryId: body.categoryId,
      recurringRuleId,
      tags: body.tagIds
        ? {
            create: body.tagIds.map((tagId) => ({ tagId })),
          }
        : undefined,
    },
    include: {
      category: true,
      recurringRule: true,
      tags: { include: { tag: true } },
    },
  })

  return NextResponse.json(schedule, { status: 201 })
}
