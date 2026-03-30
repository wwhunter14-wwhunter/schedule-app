import type { Schedule, Category, Tag, RecurringRule, ScheduleTag } from '@prisma/client'

export type ScheduleWithRelations = Schedule & {
  category: Category | null
  recurringRule: RecurringRule | null
  tags: (ScheduleTag & { tag: Tag })[]
}

export type ScheduleSummary = Pick<
  Schedule,
  'id' | 'title' | 'startAt' | 'endAt' | 'allDay' | 'color' | 'isRecurring' | 'notifyAt'
> & {
  category: Category | null
  tags: (ScheduleTag & { tag: Tag })[]
}

export type ScheduleOccurrence = {
  id: string
  scheduleId: number
  title: string
  startAt: Date
  endAt: Date
  allDay: boolean
  color: string | null
  categoryColor: string | null
  isRecurring: true
}

export type CalendarEvent = {
  id: string
  scheduleId: number
  title: string
  startAt: Date
  endAt: Date
  allDay: boolean
  color: string | null
  categoryColor: string | null
  isRecurring: boolean
}

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export type CreateScheduleInput = {
  title: string
  description?: string
  summary?: string
  sourceUrl?: string
  memo?: string
  attachmentName?: string | null
  attachmentPath?: string | null
  attachmentName2?: string | null
  attachmentPath2?: string | null
  startAt: string
  endAt: string
  allDay?: boolean
  color?: string
  notifyMinutes?: number
  categoryId?: number
  tagIds?: number[]
  recurring?: {
    frequency: RecurringFrequency
    interval: number
    daysOfWeek?: string
    endDate?: string
    count?: number
  }
}
