'use client'

import {
  startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameDay, isToday, differenceInMinutes,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import type { CalendarEvent } from '@/lib/types'

type Props = {
  viewDate: Date
  events: CalendarEvent[]
}

const HOUR_HEIGHT = 60 // px per hour
const TOTAL_HEIGHT = HOUR_HEIGHT * 24

export default function WeekGrid({ viewDate, events }: Props) {
  const weekStart = startOfWeek(viewDate, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(viewDate, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const allDayEvents = events.filter((e) => e.allDay)
  const timedEvents = events.filter((e) => !e.allDay)

  const eventsForDay = (day: Date) =>
    timedEvents.filter((e) => isSameDay(new Date(e.startAt), day))

  const getEventStyle = (event: CalendarEvent) => {
    const start = new Date(event.startAt)
    const end = new Date(event.endAt)
    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const durationMinutes = Math.max(differenceInMinutes(end, start), 30)
    const top = (startMinutes / 60) * HOUR_HEIGHT
    const height = (durationMinutes / 60) * HOUR_HEIGHT
    return { top, height }
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div>
      {/* 하루종일 이벤트 영역 */}
      {allDayEvents.length > 0 && (
        <div className="flex border border-slate-200 dark:border-slate-700 rounded mb-2">
          <div className="w-14 flex-shrink-0 py-1 text-xs text-slate-400 dark:text-slate-500 text-right pr-2 border-r border-slate-200 dark:border-slate-700">
            종일
          </div>
          <div className="flex-1 grid grid-cols-7">
            {days.map((day) => {
              const dayAllDay = allDayEvents.filter((e) => isSameDay(new Date(e.startAt), day))
              return (
                <div key={day.toISOString()} className="p-0.5 space-y-0.5">
                  {dayAllDay.map((e) => (
                    <Link
                      key={e.id}
                      href={`/schedules/${e.scheduleId}`}
                      className="block text-xs truncate rounded px-1 py-0.5 text-white"
                      style={{ backgroundColor: e.color ?? e.categoryColor ?? '#6366f1' }}
                    >
                      {e.title}
                    </Link>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 날짜 헤더 */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-px">
        <div className="w-14 flex-shrink-0" />
        {days.map((day, i) => (
          <div
            key={day.toISOString()}
            className={`flex-1 text-center py-2 text-sm ${
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="text-xs text-slate-500 dark:text-slate-400">{format(day, 'E', { locale: ko })}</div>
            <div
              className={`text-lg font-semibold inline-flex w-8 h-8 items-center justify-center rounded-full ${
                isToday(day) ? 'bg-indigo-600 text-white' : ''
              }`}
            >
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* 시간 그리드 */}
      <div className="flex overflow-y-auto" style={{ maxHeight: '70vh' }}>
        {/* 시간 레이블 */}
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

        {/* 일별 컬럼 */}
        {days.map((day) => {
          const dayEvents = eventsForDay(day)
          return (
            <div
              key={day.toISOString()}
              className="flex-1 relative border-l border-slate-200 dark:border-slate-700"
              style={{ height: TOTAL_HEIGHT }}
            >
              {/* 시간 구분선 */}
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute w-full border-t border-slate-100 dark:border-slate-800"
                  style={{ top: h * HOUR_HEIGHT }}
                />
              ))}

              {/* 이벤트 */}
              {dayEvents.map((e) => {
                const { top, height } = getEventStyle(e)
                const bg = e.color ?? e.categoryColor ?? '#6366f1'
                return (
                  <Link
                    key={e.id}
                    href={`/schedules/${e.scheduleId}`}
                    className="absolute left-0.5 right-0.5 rounded px-1 text-white overflow-hidden hover:opacity-90 transition-opacity"
                    style={{ top, height, minHeight: 20, backgroundColor: bg }}
                    title={e.title}
                  >
                    <p className="text-xs font-medium truncate">{e.title}</p>
                    <p className="text-xs opacity-80">
                      {format(new Date(e.startAt), 'HH:mm')}
                    </p>
                  </Link>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
