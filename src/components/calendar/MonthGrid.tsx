'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, format, isToday,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import type { CalendarEvent } from '@/lib/types'
import EventChip from './EventChip'

const DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토']
const MAX_VISIBLE = 3

type Props = { viewDate: Date; events: CalendarEvent[] }

export default function MonthGrid({ viewDate, events }: Props) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(viewDate), { weekStartsOn: 0 }),
  })

  const eventsForDay = (day: Date) =>
    events
      .filter((e) => isSameDay(new Date(e.startAt), day))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        {DAY_HEADERS.map((d, i) => (
          <div
            key={d}
            className={`py-2.5 text-center text-xs font-semibold uppercase tracking-wide ${
              i === 0 ? 'text-rose-500' : i === 6 ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 bg-white dark:bg-slate-950">
        {days.map((day) => {
          const dayEvents = eventsForDay(day)
          const dayKey = day.toISOString()
          const isExpanded = expandedDay === dayKey
          const visibleEvents = isExpanded ? dayEvents : dayEvents.slice(0, MAX_VISIBLE)
          const hiddenCount = dayEvents.length - MAX_VISIBLE
          const outsideMonth = !isSameMonth(day, viewDate)

          return (
            <div
              key={dayKey}
              className={`min-h-[96px] p-1.5 border-r border-b border-slate-100 dark:border-slate-800 last:border-r-0 ${
                outsideMonth ? 'bg-slate-50/60 dark:bg-slate-900/40' : ''
              }`}
            >
              <Link
                href={`/schedules/new?date=${format(day, 'yyyy-MM-dd')}`}
                className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 hover:ring-2 hover:ring-indigo-400 transition-all ${
                  isToday(day)
                    ? 'bg-indigo-600 text-white'
                    : outsideMonth
                    ? 'text-slate-300 dark:text-slate-700'
                    : day.getDay() === 0
                    ? 'text-rose-500'
                    : day.getDay() === 6
                    ? 'text-blue-500'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {format(day, 'd')}
              </Link>
              <div className="space-y-0.5">
                {visibleEvents.map((e) => <EventChip key={e.id} event={e} compact />)}
                {!isExpanded && hiddenCount > 0 && (
                  <button
                    onClick={() => setExpandedDay(dayKey)}
                    className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 px-1 w-full text-left"
                  >
                    +{hiddenCount}개
                  </button>
                )}
                {isExpanded && (
                  <button
                    onClick={() => setExpandedDay(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 px-1"
                  >
                    접기
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
