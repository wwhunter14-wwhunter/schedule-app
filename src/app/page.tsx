import Link from 'next/link'
import { format, isToday, isTomorrow, startOfDay, endOfDay, addDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { prisma } from '@/lib/prisma'
import CategoryBadge from '@/components/categories/CategoryBadge'
import { expandRecurringSchedule } from '@/lib/recurrence'

export const dynamic = 'force-dynamic'
export const metadata = { title: '대시보드' }

type DashboardSchedule = {
  id: string | number
  title: string
  startAt: Date
  endAt: Date
  allDay: boolean
  color: string | null
  isRecurring: boolean
  category: { name: string; color: string } | null
  tags: { tag: { id: number; name: string } }[]
}

export default async function DashboardPage() {
  const now = new Date()
  const todayStart = startOfDay(now)
  const tomorrowEnd = endOfDay(addDays(now, 1))

  // 일반 일정
  const regularSchedules = await prisma.schedule.findMany({
    where: { startAt: { gte: todayStart, lte: tomorrowEnd }, isRecurring: false },
    orderBy: { startAt: 'asc' },
    take: 20,
    include: { category: true, tags: { include: { tag: true } } },
  })

  // 반복 일정 - 규칙 포함해서 불러오기
  const recurringMasters = await prisma.schedule.findMany({
    where: { isRecurring: true },
    include: { category: true, recurringRule: true, tags: { include: { tag: true } } },
  })

  // 반복 일정 인스턴스 확장 후 오늘-내일 범위 필터
  const recurringOccurrences: DashboardSchedule[] = recurringMasters
    .filter((m) => m.recurringRule !== null)
    .flatMap((m) => expandRecurringSchedule(m as Parameters<typeof expandRecurringSchedule>[0], todayStart, tomorrowEnd))
    .map((occ) => {
      const master = recurringMasters.find((m) => m.id === occ.scheduleId)!
      return {
        id: occ.id,
        title: occ.title,
        startAt: occ.startAt,
        endAt: occ.endAt,
        allDay: occ.allDay,
        color: occ.color,
        isRecurring: true,
        category: master.category,
        tags: master.tags,
      }
    })

  // 합치고 시간순 정렬
  const upcomingSchedules: DashboardSchedule[] = [
    ...regularSchedules.map((s) => ({ ...s, id: s.id as string | number })),
    ...recurringOccurrences,
  ].sort((a, b) => a.startAt.getTime() - b.startAt.getTime())

  const todaySchedules = upcomingSchedules.filter((s) => isToday(s.startAt))
  const tomorrowSchedules = upcomingSchedules.filter((s) => isTomorrow(s.startAt))

  const totalCount = await prisma.schedule.count()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 fade-in">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            {format(now, 'yyyy년 M월 d일 (E)', { locale: ko })}
          </p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">안녕하세요 👋</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            오늘 일정 <span className="font-semibold text-indigo-600 dark:text-indigo-400">{todaySchedules.length}개</span>가 있습니다
          </p>
        </div>
        <Link
          href="/schedules/new"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm shadow-sm transition-colors"
        >
          + 새 일정
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: '전체 일정', value: totalCount, icon: '📋' },
          { label: '오늘', value: todaySchedules.length, icon: '📍' },
          { label: '내일', value: tomorrowSchedules.length, icon: '🗓️' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center shadow-sm"
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</div>
          </div>
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
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-400 dark:text-slate-500 text-sm">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map((s) => {
            // 반복 일정 id는 "masterId_date" 형식 → 원본 일정 링크로 이동
            const scheduleId = typeof s.id === 'string' ? s.id.split('_')[0] : s.id
            return (
            <Link
              key={s.id}
              href={`/schedules/${scheduleId}`}
              className="flex items-start gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
            >
              <div
                className="w-1 self-stretch rounded-full flex-shrink-0"
                style={{ backgroundColor: s.color ?? s.category?.color ?? '#6366f1' }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{s.title}</p>
                  {s.isRecurring && <span className="text-xs text-slate-400">↻</span>}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {s.allDay ? '하루 종일' : `${format(s.startAt, 'HH:mm')} – ${format(s.endAt, 'HH:mm')}`}
                </p>
                {s.category && (
                  <div className="mt-1.5">
                    <CategoryBadge name={s.category.name} color={s.category.color} />
                  </div>
                )}
              </div>
              <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
