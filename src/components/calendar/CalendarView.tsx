'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  startOfDay, endOfDay,
} from 'date-fns'
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

export default function CalendarView() {
  const [view, setView] = useState<View>('month')
  const [viewDate, setViewDate] = useState(new Date())
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

      // Non-recurring base events
      const baseEvents = schedules
        .filter((s) => !s.isRecurring)
        .map(toCalendarEvent)

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
      {view === 'month' && <MonthGrid viewDate={viewDate} events={events} />}
      {view === 'week' && <WeekGrid viewDate={viewDate} events={events} />}
      {view === 'day' && <DayGrid viewDate={viewDate} events={events} />}
    </div>
  )
}
