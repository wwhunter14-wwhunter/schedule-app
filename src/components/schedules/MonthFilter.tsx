'use client'

import { useRouter } from 'next/navigation'

export default function MonthFilter({
  years, year, month, day,
}: {
  years: number[]; year: number; month: number; day?: number
}) {
  const router = useRouter()

  const navigate = (y: number, m: number) => {
    const params = new URLSearchParams({ year: String(y), month: String(m) })
    if (day) params.set('day', String(day))
    router.push(`/all-schedules?${params}`)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={year}
        onChange={(e) => navigate(Number(e.target.value), month)}
        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}년</option>
        ))}
      </select>
      <select
        value={month}
        onChange={(e) => navigate(year, Number(e.target.value))}
        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <option key={m} value={m}>{m}월</option>
        ))}
      </select>
    </div>
  )
}
