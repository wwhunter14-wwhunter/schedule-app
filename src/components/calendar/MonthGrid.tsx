'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, format, isToday,
} from 'date-fns'
import type { CalendarEvent } from '@/lib/types'
import EventChip from './EventChip'

// 음력 변환 (단순 계산 방식 - 외부 라이브러리 없이)
function getLunarDay(date: Date): { month: number; day: number; intercalation: boolean } | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const KoreanLunarCalendar = require('korean-lunar-calendar')
    const cal = new KoreanLunarCalendar()
    cal.setSolarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
    return cal.getLunarCalendar()
  } catch {
    return null
  }
}

function lunarLabel(date: Date, prevDate: Date | null): string {
  const lunar = getLunarDay(date)
  if (!lunar) return ''

  const prevLunar = prevDate ? getLunarDay(prevDate) : null
  const monthChanged = !prevLunar || prevLunar.month !== lunar.month

  if (lunar.day === 1 || monthChanged) {
    return `${lunar.intercalation ? '윤' : ''}${lunar.month}월`
  }
  if (lunar.day === 15) return '보름'
  return `${lunar.day}`
}

const DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토']
const MAX_VISIBLE = 3

type Props = { viewDate: Date; events: CalendarEvent[] }

export default function MonthGrid({ viewDate, events }: Props) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  const days = useMemo(() => eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(viewDate), { weekStartsOn: 0 }),
  }), [viewDate])

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
        {days.map((day, idx) => {
          const dayEvents = eventsForDay(day)
          const dayKey = day.toISOString()
          const isExpanded = expandedDay === dayKey
          const visibleEvents = isExpanded ? dayEvents : dayEvents.slice(0, MAX_VISIBLE)
          const hiddenCount = dayEvents.length - MAX_VISIBLE
          const outsideMonth = !isSameMonth(day, viewDate)
          const lunar = lunarLabel(day, idx > 0 ? days[idx - 1] : null)
          const isLunarMonthStart = lunar.includes('월')

          return (
            <div
              key={dayKey}
              className={`min-h-[100px] p-1.5 border-r border-b border-slate-100 dark:border-slate-800 last:border-r-0 ${
                outsideMonth ? 'bg-slate-50/60 dark:bg-slate-900/40' : ''
              }`}
            >
              {/* 날짜 숫자 + 음력 */}
              <div className="flex items-center gap-1 mb-1">
                <Link
                  href={`/schedules/new?date=${format(day, 'yyyy-MM-dd')}`}
                  className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full hover:ring-2 hover:ring-indigo-400 transition-all flex-shrink-0 ${
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
                {lunar && (
                  <span
                    className={`text-[10px] leading-none truncate ${
                      isLunarMonthStart
                        ? 'text-amber-500 dark:text-amber-400 font-medium'
                        : outsideMonth
                        ? 'text-slate-300 dark:text-slate-700'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {lunar}
                  </span>
                )}
              </div>

              {/* 일정 목록 */}
              <div className="space-y-0.5">
                {visibleEvents.map((e) => (
                  <Link
                    key={e.id}
                    href={`/schedules/${e.scheduleId}`}
                    className="flex items-center gap-1 px-1 py-0.5 rounded text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: e.color ?? e.categoryColor ?? '#6366f1' }}
                    />
                    <span className="truncate text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {e.isRecurring && <span className="opacity-50 mr-0.5">↻</span>}
                      {e.title}
                    </span>
                  </Link>
                ))}
                {!isExpanded && hiddenCount > 0 && (
                  <button
                    onClick={() => setExpandedDay(dayKey)}
                    className="text-[10px] text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 px-1 w-full text-left"
                  >
                    +{hiddenCount}개 더
                  </button>
                )}
                {isExpanded && (
                  <button
                    onClick={() => setExpandedDay(null)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 px-1"
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
