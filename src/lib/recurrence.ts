import { addDays, addWeeks, addMonths, addYears, isBefore, isAfter } from 'date-fns'
import type { Schedule, RecurringRule, Category } from '@prisma/client'
import type { ScheduleOccurrence } from './types'

type ScheduleWithRule = Schedule & {
  recurringRule: RecurringRule
  category: Category | null
}

export function expandRecurringSchedule(
  master: ScheduleWithRule,
  windowStart: Date,
  windowEnd: Date
): ScheduleOccurrence[] {
  const rule = master.recurringRule
  const duration = master.endAt.getTime() - master.startAt.getTime()
  const results: ScheduleOccurrence[] = []

  let cursor = new Date(master.startAt)
  let count = 0
  const maxIter = 500

  const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const allowedDays = rule.daysOfWeek ? rule.daysOfWeek.split(',') : null

  while (count < maxIter) {
    if (rule.endDate && isAfter(cursor, new Date(rule.endDate))) break
    if (rule.count && count >= rule.count) break
    if (isAfter(cursor, windowEnd)) break

    const occEnd = new Date(cursor.getTime() + duration)
    if (!isBefore(occEnd, windowStart)) {
      const dayName = DAY_NAMES[cursor.getDay()]
      const matchesDay = !allowedDays || allowedDays.includes(dayName)

      if (matchesDay) {
        results.push({
          id: `${master.id}_${cursor.toISOString()}`,
          scheduleId: master.id,
          title: master.title,
          startAt: new Date(cursor),
          endAt: occEnd,
          allDay: master.allDay,
          color: master.color,
          categoryColor: master.category?.color ?? null,
          isRecurring: true,
        })
      }
    }

    // Advance cursor
    switch (rule.frequency) {
      case 'DAILY':
        cursor = addDays(cursor, rule.interval)
        break
      case 'WEEKLY':
        if (allowedDays) {
          cursor = addDays(cursor, 1)
          // When we complete a full week, skip by interval
          if (cursor.getDay() === 0) {
            cursor = addWeeks(cursor, rule.interval - 1)
          }
        } else {
          cursor = addWeeks(cursor, rule.interval)
        }
        break
      case 'MONTHLY':
        cursor = addMonths(cursor, rule.interval)
        break
      case 'YEARLY':
        cursor = addYears(cursor, rule.interval)
        break
      default:
        cursor = addDays(cursor, 1)
    }

    count++
  }

  return results
}
