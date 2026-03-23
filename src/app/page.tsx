import Link from 'next/link'
import { isToday, isTomorrow, startOfDay, endOfDay, addDays } from 'date-fns'
import { formatKST } from '@/lib/formatKST'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import CategoryBadge from '@/components/categories/CategoryBadge'
import { expandRecurringSchedule } from '@/lib/recurrence'
import ScheduleDeleteButton from '@/components/schedules/ScheduleDeleteButton'
import StarButton from '@/components/schedules/StarButton'

export const dynamic = 'force-dynamic'
export const metadata = { title: '대시보드' }

type DashboardSchedule = {
  id: string | number
  title: string
  startAt: Date
  endAt: Date
  allDay: boolean
  color: string | null
  isImportant: boolean
  isRecurring: boolean
  sourceUrl: string | null
  updatedAt: Date
  category: { name: string; color: string } | null
  tags: { tag: { id: number; name: string } }[]
}

export default async function DashboardPage() {
  const session = await auth()
  const userId = parseInt(session?.user?.id ?? '0')

  const now = new Date()
  const todayStart = startOfDay(now)
  const tomorrowEnd = endOfDay(addDays(now, 1))

  const regularSchedules = await prisma.schedule.findMany({
    where: { userId, startAt: { gte: todayStart, lte: tomorrowEnd }, isRecurring: false },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    include: { category: true, tags: { include: { tag: true } } },
  })

  const recurringMasters = await prisma.schedule.findMany({
    where: { userId, isRecurring: true },
    include: { category: true, recurringRule: true, tags: { include: { tag: true } } },
  })

  const recurringOccurrences: DashboardSchedule[] = recurringMasters
    .filter((m) => m.recurringRule !== null)
    .flatMap((m) => expandRecurringSchedule(m as Parameters<typeof expandRecurringSchedule>[0], todayStart, tomorrowEnd))
    .map((occ) => {
      const master = recurringMasters.find((m) => m.id === occ.scheduleId)!
      return { id: occ.id, title: occ.title, startAt: occ.startAt, endAt: occ.endAt, allDay: occ.allDay, color: occ.color, isImportant: master.isImportant, isRecurring: true, sourceUrl: master.sourceUrl ?? null, updatedAt: master.updatedAt, category: master.category, tags: master.tags }
    })

  const upcomingSchedules: DashboardSchedule[] = [
    ...regularSchedules.map((s) => ({ ...s, id: s.id as string | number, sourceUrl: s.sourceUrl ?? null, isImportant: s.isImportant })),
    ...recurringOccurrences,
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

  const todaySchedules = upcomingSchedules.filter((s) => isToday(s.startAt))
  const tomorrowSchedules = upcomingSchedules.filter((s) => isTomorrow(s.startAt))
  const totalCount = await prisma.schedule.count({ where: { userId } })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            {formatKST(now, 'yyyy년 M월 d일 (E)')}
          </p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">안녕하세요, {session?.user?.name ?? '?'} 👋</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            오늘 일정 <span className="font-semibold text-indigo-600 dark:text-indigo-400">{todaySchedules.length}개</span>가 있습니다
          </p>
        </div>
        <Link href="/schedules/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm shadow-sm transition-colors">
          + 새 일정
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: '전체 일정', value: totalCount, icon: '📋', href: '/all-schedules' },
          { label: '오늘', value: todaySchedules.length, icon: '📍', href: `/all-schedules?year=${now.getFullYear()}&month=${now.getMonth() + 1}&day=${now.getDate()}` },
          { label: '내일', value: tomorrowSchedules.length, icon: '🗓️', href: `/all-schedules?year=${addDays(now,1).getFullYear()}&month=${addDays(now,1).getMonth() + 1}&day=${addDays(now,1).getDate()}` },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</div>
          </Link>
        ))}
      </div>

      <ScheduleSection title="오늘" schedules={todaySchedules} emptyText="오늘 일정이 없습니다" />
      <ScheduleSection title="내일" schedules={tomorrowSchedules} emptyText="내일 일정이 없습니다" className="mt-6" />

      <div className="mt-6 text-center">
        <Link href="/calendar" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium">
          캘린더 전체 보기 →
        </Link>
      </div>
    </div>
  )
}

function ScheduleSection({ title, schedules, emptyText, className = '' }: {
  title: string; schedules: DashboardSchedule[]; emptyText: string; className?: string
}) {
  return (
    <div className={className}>
      <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
        {title} <span className="text-slate-400 dark:text-slate-500 font-normal normal-case">({schedules.length})</span>
      </h2>
      {schedules.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-400 dark:text-slate-500 text-sm">{emptyText}</div>
      ) : (
        <div className="space-y-2">
          {schedules.map((s) => {
            const scheduleId = typeof s.id === 'string' ? s.id.split('_')[0] : s.id
            return (
              <div key={s.id} className="flex items-start gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all">
                <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: s.color ?? s.category?.color ?? '#6366f1' }} />
                <Link href={`/schedules/${scheduleId}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{s.title}</p>
                    {s.isRecurring && <span className="text-xs text-slate-400">↻</span>}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {s.allDay ? '하루 종일' : `${formatKST(s.startAt, 'HH:mm')} – ${formatKST(s.endAt, 'HH:mm')}`}
                  </p>
                  {s.category && <div className="mt-1.5"><CategoryBadge name={s.category.name} color={s.category.color} /></div>}
                </Link>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {s.sourceUrl && (
                    <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" title="원본 링크 열기" className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                  )}
                  <StarButton id={Number(scheduleId)} isImportant={s.isImportant} size="sm" />
                  <ScheduleDeleteButton id={Number(scheduleId)} size="sm" />
                  <Link href={`/schedules/${scheduleId}/edit`} title="편집" className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </Link>
                  <Link href={`/schedules/${scheduleId}`} title="상세 보기" className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
