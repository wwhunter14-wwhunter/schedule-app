'use client'

import {
  format, isSameDay, differenceInMinutes,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import type { CalendarEvent } from '@/lib/types'

type Props = {
  viewDate: Date
  events: CalendarEvent[]
}

const HOUR_HEIGHT = 64
const TOTAL_HEIGHT = HOUR_HEIGHT * 24

export default function DayGrid({ viewDate, events }: Props) {
  const dayEvents = events.filter((e) => isSameDay(new Date(e.startAt), viewDate))
  const allDayEvents = dayEvents.filter((e) => e.allDay)
  const timedEvents = dayEvents.filter((e) => !e.allDay)

  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getEventStyle = (event: CalendarEvent) => {
    const start = new Date(event.startAt)
    const end = new Date(event.endAt)
    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const durationMinutes = Math.max(differenceInMinutes(end, start), 30)
    const top = (startMinutes / 60) * HOUR_HEIGHT
    const height = (durationMinutes / 60) * HOUR_HEIGHT
    return { top, height }
  }

  return (
    <div>
      {/* 하루종일 */}
      {allDayEvents.length > 0 && (
        <div className="mb-3 space-y-1 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">하루 종일</p>
          {allDayEvents.map((e) => (
            <Link
              key={e.id}
              href={`/schedules/${e.scheduleId}`}
              className="block text-sm truncate rounded px-2 py-1 text-white"
              style={{ backgroundColor: e.color ?? e.categoryColor ?? '#6366f1' }}
            >
              {e.title}
            </Link>
          ))}
        </div>
      )}

      {/* 시간 그리드 */}
      <div className="flex overflow-y-auto" style={{ maxHeight: '75vh' }}>
        <div className="w-14 flex-shrink-0 relative" style={{ height: TOTAL_HEIGHT }}>
          {hours.map((h) => (
            <div
              key={h}
              className="absolute right-2 text-xs text-slate-400 dark:text-slate-500"
              style={{ top: h * HOUR_HEIGHT - 8 }}
            >
              {h === 0 ? '' : `${h}시`}
            </div>
          ))}
        </div>

        <div className="flex-1 relative border-l border-slate-200 dark:border-slate-700" style={{ height: TOTAL_HEIGHT }}>
          {hours.map((h) => (
            <div
              key={h}
              className="absolute w-full border-t border-slate-100 dark:border-slate-800"
              style={{ top: h * HOUR_HEIGHT }}
            />
          ))}

          {timedEvents.map((e) => {
            const { top, height } = getEventStyle(e)
            const bg = e.color ?? e.categoryColor ?? '#6366f1'
            return (
              <Link
                key={e.id}
                href={`/schedules/${e.scheduleId}`}
                className="absolute left-1 right-1 rounded-lg px-2 text-white hover:opacity-90 transition-opacity overflow-hidden"
                style={{ top, height, minHeight: 24, backgroundColor: bg }}
              >
                <p className="text-sm font-medium">{e.title}</p>
                <p className="text-xs opacity-80">
                  {format(new Date(e.startAt), 'HH:mm')} -{' '}
                  {format(new Date(e.endAt), 'HH:mm')}
                </p>
              </Link>
            )
          })}
        </div>
      </div>

      {timedEvents.length === 0 && allDayEvents.length === 0 && (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <p className="text-4xl mb-2">📅</p>
          <p>일정이 없습니다</p>
          <Link
            href="/schedules/new"
            className="mt-3 inline-block text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 text-sm"
          >
            새 일정 만들기
          </Link>
        </div>
      )}
    </div>
  )
}
