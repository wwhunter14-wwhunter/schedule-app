'use client'

import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns'
import { ko } from 'date-fns/locale'

type View = 'month' | 'week' | 'day'

type Props = {
  view: View
  setView: (v: View) => void
  viewDate: Date
  setViewDate: (d: Date) => void
  onToday: () => void
}

export default function CalendarToolbar({ view, setView, viewDate, setViewDate, onToday }: Props) {
  const goPrev = () => {
    if (view === 'month') setViewDate(subMonths(viewDate, 1))
    else if (view === 'week') setViewDate(subWeeks(viewDate, 1))
    else setViewDate(subDays(viewDate, 1))
  }
  const goNext = () => {
    if (view === 'month') setViewDate(addMonths(viewDate, 1))
    else if (view === 'week') setViewDate(addWeeks(viewDate, 1))
    else setViewDate(addDays(viewDate, 1))
  }

  const title =
    view === 'month' ? format(viewDate, 'yyyy년 M월', { locale: ko })
    : view === 'week' ? `${format(viewDate, 'yyyy년 M월 d일', { locale: ko })} 주`
    : format(viewDate, 'yyyy년 M월 d일 (E)', { locale: ko })

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
        >
          오늘
        </button>
        <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <button onClick={goPrev} className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm">‹</button>
          <button onClick={goNext} className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm border-l border-slate-200 dark:border-slate-700">›</button>
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      </div>

      <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        {(['month', 'week', 'day'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              view === v
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            } ${v !== 'month' ? 'border-l border-slate-200 dark:border-slate-700' : ''}`}
          >
            {v === 'month' ? '월' : v === 'week' ? '주' : '일'}
          </button>
        ))}
      </div>
    </div>
  )
}
