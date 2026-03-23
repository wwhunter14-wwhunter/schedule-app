import Link from 'next/link'
import CalendarView from '@/components/calendar/CalendarView'
import TodayPanel from '@/components/calendar/TodayPanel'

export const metadata = { title: '캘린더' }

export default function CalendarPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">캘린더</h1>
        <Link
          href="/schedules/new"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors"
        >
          + 새 일정
        </Link>
      </div>
      <CalendarView />
      <TodayPanel />
    </div>
  )
}
