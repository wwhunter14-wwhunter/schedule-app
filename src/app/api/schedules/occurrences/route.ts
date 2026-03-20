import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { expandRecurringSchedule } from '@/lib/recurrence'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!from || !to) {
    return NextResponse.json({ error: 'from과 to 파라미터가 필요합니다' }, { status: 400 })
  }

  const windowStart = new Date(from)
  const windowEnd = new Date(to)

  const recurringMasters = await prisma.schedule.findMany({
    where: { isRecurring: true },
    include: { recurringRule: true, category: true },
  })

  const validMasters = recurringMasters.filter((m) => m.recurringRule !== null)

  const occurrences = validMasters.flatMap((master) =>
    expandRecurringSchedule(
      master as Parameters<typeof expandRecurringSchedule>[0],
      windowStart,
      windowEnd
    )
  )

  return NextResponse.json(occurrences)
}
