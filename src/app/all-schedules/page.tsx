export const dynamic = 'force-dynamic'
export const metadata = { title: '전체 일정' }

import Link from 'next/link'
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import CategoryBadge from '@/components/categories/CategoryBadge'
import StarButton from '@/components/schedules/StarButton'
import ScheduleDeleteButton from '@/components/schedules/ScheduleDeleteButton'
import MonthFilter from '@/components/schedules/MonthFilter'

export default async function AllSchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; day?: string }>
}) {
  const session = await auth()
  const userId = parseInt(session?.user?.id ?? '0')
  const { year, month, day } = await searchParams

  const now = new Date()
  const y = year ? parseInt(year) : now.getFullYear()
  const m = month ? parseInt(month) : now.getMonth() + 1
  const d = day ? parseInt(day) : null

  const rangeStart = d
    ? startOfDay(new Date(y, m - 1, d))
    : startOfMonth(new Date(y, m - 1, 1))
  const rangeEnd = d
    ? endOfDay(new Date(y, m - 1, d))
    : endOfMonth(new Date(y, m - 1, 1))

  const schedules = await prisma.schedule.findMany({
    where: {
      userId,
      startAt: { gte: rangeStart, lte: rangeEnd },
    },
    orderBy: { createdAt: 'desc' },
    include: { category: true, tags: { include: { tag: true } } },
  })

  // 년도 목록 (현재 연도 기준 ±3년)
  const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i)

  const title = d
    ? `${y}년 ${m}월 ${d}일`
    : `${y}년 ${m}월`

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">전체 일정</h1>
        <Link href="/schedules/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm shadow-sm transition-colors">+ 새 일정</Link>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <MonthFilter years={years} year={y} month={m} day={d ?? undefined} />
        {d && (
          <Link
            href={`/all-schedules?year=${y}&month=${m}`}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            월 전체 보기
          </Link>
        )}
      </div>

      <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">
        {title} · {schedules.length}개
      </div>

      {schedules.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-400 dark:text-slate-500 text-sm">
          이 기간에 일정이 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map((s) => (
            <div key={s.id} className={`flex items-start gap-3 bg-white dark:bg-slate-900 border rounded-2xl p-4 hover:shadow-md transition-all ${s.isImportant ? 'border-amber-200 dark:border-amber-800/50' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'}`}>
              <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: s.color ?? s.category?.color ?? '#6366f1' }} />
              <Link href={`/schedules/${s.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{s.title}</p>
                  {s.isRecurring && <span className="text-xs text-slate-400">↻</span>}
                  {s.isImportant && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-amber-400 flex-shrink-0">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {format(s.startAt, 'yyyy.MM.dd (E)', { locale: ko })} {s.allDay ? '(하루 종일)' : format(s.startAt, 'HH:mm')}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {s.category && <CategoryBadge name={s.category.name} color={s.category.color} />}
                  {s.tags.map(({ tag }) => (
                    <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">#{tag.name}</span>
                  ))}
                </div>
              </Link>
              <div className="flex items-center gap-1 flex-shrink-0">
                {s.sourceUrl && (
                  <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" title="원본 링크 열기" className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                )}
                <StarButton id={s.id} isImportant={s.isImportant} size="sm" />
                <ScheduleDeleteButton id={s.id} size="sm" />
                <Link href={`/schedules/${s.id}`} title="상세 보기" className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
