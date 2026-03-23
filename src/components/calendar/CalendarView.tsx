'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  startOfDay, endOfDay, isSameDay, format,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import type { CalendarEvent, ScheduleWithRelations, ScheduleOccurrence } from '@/lib/types'
import CalendarToolbar from './CalendarToolbar'
import MonthGrid from './MonthGrid'
import WeekGrid from './WeekGrid'
import DayGrid from './DayGrid'

type View = 'month' | 'week' | 'day'

function getWindowRange(view: View, date: Date): [Date, Date] {
  if (view === 'month') {
    const ms = startOfMonth(date)
    const me = endOfMonth(date)
    return [startOfWeek(ms, { weekStartsOn: 0 }), endOfWeek(me, { weekStartsOn: 0 })]
  }
  if (view === 'week') {
    return [startOfWeek(date, { weekStartsOn: 0 }), endOfWeek(date, { weekStartsOn: 0 })]
  }
  return [startOfDay(date), endOfDay(date)]
}

function toCalendarEvent(s: ScheduleWithRelations): CalendarEvent {
  return {
    id: String(s.id),
    scheduleId: s.id,
    title: s.title,
    startAt: new Date(s.startAt),
    endAt: new Date(s.endAt),
    allDay: s.allDay,
    color: s.color,
    categoryColor: s.category?.color ?? null,
    isRecurring: s.isRecurring,
  }
}

function occurrenceToCalendarEvent(o: ScheduleOccurrence): CalendarEvent {
  return {
    id: o.id,
    scheduleId: o.scheduleId,
    title: o.title,
    startAt: new Date(o.startAt),
    endAt: new Date(o.endAt),
    allDay: o.allDay,
    color: o.color,
    categoryColor: o.categoryColor,
    isRecurring: true,
  }
}

function useLunarDate(date: Date): string {
  const [lunar, setLunar] = useState('')
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const mod = await import('korean-lunar-calendar')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const KLC = (mod as any).default ?? mod
        const cal = new KLC()
        cal.setSolarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
        const l = cal.getLunarCalendar()
        if (!cancelled) {
          setLunar(`음력 ${l.intercalation ? '윤' : ''}${l.month}월 ${l.day}일`)
        }
      } catch {
        if (!cancelled) setLunar('')
      }
    })()
    return () => { cancelled = true }
  }, [date])
  return lunar
}

function DayPanel({ date, events }: { date: Date; events: CalendarEvent[] }) {
  const lunarStr = useLunarDate(date)
  const dayEvents = events
    .filter((e) => isSameDay(new Date(e.startAt), date))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())

  return (
    <div className="mt-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {format(date, 'M월 d일 (E)', { locale: ko })}
            <span className="ml-2 text-sm font-normal text-slate-400">일정 {dayEvents.length}개</span>
          </h2>
          {lunarStr && (
            <p className="text-xs text-amber-500 dark:text-amber-400 mt-0.5">{lunarStr}</p>
          )}
        </div>
        <Link
          href={`/schedules/new?date=${format(date, 'yyyy-MM-dd')}`}
          className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
        >
          + 새 일정
        </Link>
      </div>

      {dayEvents.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">이 날 일정이 없습니다</p>
      ) : (
        <div className="space-y-1">
          {dayEvents.map((e) => (
            <Link
              key={e.id}
              href={`/schedules/${e.scheduleId}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
            >
              <div
                className="w-1 self-stretch rounded-full flex-shrink-0"
                style={{ backgroundColor: e.color ?? e.categoryColor ?? '#6366f1' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {e.isRecurring && <span className="text-slate-400 mr-1">↻</span>}
                  {e.title}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {e.allDay ? '하루 종일' : format(new Date(e.startAt), 'HH:mm')}
                </p>
              </div>
              <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CalendarView() {
  const [view, setView] = useState<View>('month')
  const [viewDate, setViewDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const [from, to] = getWindowRange(view, viewDate)
    const params = `from=${from.toISOString()}&to=${to.toISOString()}`

    try {
      const [schedulesRes, occurrencesRes] = await Promise.all([
        fetch(`/api/schedules?${params}`),
        fetch(`/api/schedules/occurrences?${params}`),
      ])

      const schedules: ScheduleWithRelations[] = await schedulesRes.json()
      const occurrences: ScheduleOccurrence[] = await occurrencesRes.json()

      const baseEvents = schedules.filter((s) => !s.isRecurring).map(toCalendarEvent)
      const occurrenceEvents = occurrences.map(occurrenceToCalendarEvent)

      setEvents([...baseEvents, ...occurrenceEvents])
    } catch (err) {
      console.error('Failed to fetch events', err)
    } finally {
      setLoading(false)
    }
  }, [view, viewDate])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return (
    <div className="relative">
      <CalendarToolbar
        view={view}
        setView={setView}
        viewDate={viewDate}
        setViewDate={setViewDate}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10 rounded">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {view === 'month' && (
        <MonthGrid
          viewDate={viewDate}
          events={events}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      )}
      {view === 'week' && <WeekGrid viewDate={viewDate} events={events} />}
      {view === 'day' && <DayGrid viewDate={viewDate} events={events} />}

      <DayPanel date={selectedDate} events={events} />
    </div>
  )
}
