'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, format, isToday,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import type { CalendarEvent } from '@/lib/types'
import { getLunarDate } from '@/lib/lunar'

const DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토']
const MAX_DOTS = 3

type Props = { viewDate: Date; events: CalendarEvent[] }

function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) return '종일'
  const start = new Date(event.startAt)
  const end = new Date(event.endAt)
  const fmt = (d: Date) => {
    const h = d.getHours()
    const m = d.getMinutes()
    const period = h < 12 ? '오전' : '오후'
    const hour = h % 12 === 0 ? 12 : h % 12
    return m === 0 ? `${period} ${hour}시` : `${period} ${hour}시 ${m}분`
  }
  return `${fmt(start)} - ${fmt(end)}`
}

export default function MonthGrid({ viewDate, events }: Props) {
  const today = new Date()
  const [selectedDay, setSelectedDay] = useState<Date>(today)

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(viewDate), { weekStartsOn: 0 }),
  })

  const eventsForDay = (day: Date) =>
    events
      .filter((e) => isSameDay(new Date(e.startAt), day))
      .sort((a, b) => {
        if (a.allDay && !b.allDay) return -1
        if (!a.allDay && b.allDay) return 1
        return new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      })

  const selectedEvents = eventsForDay(selectedDay)
  const selectedLunar = getLunarDate(selectedDay)
  const selectedDayOfWeek = format(selectedDay, 'E', { locale: ko })

  return (
    <div>
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
            const outsideMonth = !isSameMonth(day, viewDate)
            const isSelected = isSameDay(day, selectedDay)
            const dotCount = Math.min(dayEvents.length, MAX_DOTS)

            return (
              <button
                key={dayKey}
                onClick={() => setSelectedDay(day)}
                className={`min-h-[80px] p-1.5 border-r border-b border-slate-100 dark:border-slate-800 last:border-r-0 flex flex-col items-center gap-0.5 w-full text-left transition-colors ${
                  isSelected && !isToday(day)
                    ? 'bg-slate-100 dark:bg-slate-800/60'
                    : outsideMonth
                    ? 'bg-slate-50/60 dark:bg-slate-900/40'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-900/60'
                }`}
              >
                {/* 날짜 숫자 */}
                <span
                  className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday(day)
                      ? 'bg-indigo-600 text-white'
                      : isSelected
                      ? 'ring-2 ring-indigo-400 text-indigo-600 dark:text-indigo-400'
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
                </span>

                {/* 음력 날짜 */}
                <span className={`text-[9px] leading-none ${
                  outsideMonth ? 'text-slate-300 dark:text-slate-700' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {getLunarDate(day).replace('음력 ', '')}
                </span>

                {/* 이벤트 점 */}
                {dotCount > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {Array.from({ length: dotCount }).map((_, i) => (
                      <span
                        key={i}
                        className="w-1 h-1 rounded-full bg-indigo-500 dark:bg-indigo-400"
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 선택된 날짜 일정 패널 */}
      <div className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
        {/* 날짜 헤더 */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-baseline gap-2">
          <span className={`text-lg font-bold ${
            selectedDay.getDay() === 0 ? 'text-rose-500' : selectedDay.getDay() === 6 ? 'text-blue-500' : 'text-slate-800 dark:text-slate-100'
          }`}>
            {format(selectedDay, 'd')}. {selectedDayOfWeek}
          </span>
          <span className="text-sm text-slate-400 dark:text-slate-500">{selectedLunar}</span>
          <Link
            href={`/schedules/new?date=${format(selectedDay, 'yyyy-MM-dd')}`}
            className="ml-auto text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 font-medium"
          >
            + 일정 추가
          </Link>
        </div>

        {/* 일정 목록 */}
        {selectedEvents.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-400 dark:text-slate-500 text-center">
            일정이 없습니다
          </p>
        ) : (
          <ul>
            {selectedEvents.map((event) => {
              const color = event.color ?? event.categoryColor ?? '#6366f1'
              return (
                <li key={event.id}>
                  <Link
                    href={`/schedules/${event.scheduleId}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                  >
                    {/* 색상 바 */}
                    <span
                      className="w-1 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                        {event.isRecurring && <span className="mr-1 text-slate-400">↻</span>}
                        {event.title}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {formatEventTime(event)}
                      </p>
                    </div>
                    <span className="text-slate-300 dark:text-slate-600 text-sm">›</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
