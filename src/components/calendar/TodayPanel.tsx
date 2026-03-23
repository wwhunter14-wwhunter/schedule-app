import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { formatKST } from '@/lib/formatKST'
import { startOfDay, endOfDay } from 'date-fns'
import { expandRecurringSchedule } from '@/lib/recurrence'

function getTodayLunar(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const KoreanLunarCalendar = require('korean-lunar-calendar')
    const cal = new KoreanLunarCalendar()
    const now = new Date()
    cal.setSolarDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
    const lunar = cal.getLunarCalendar()
    const leap = lunar.intercalation ? '윤' : ''
    return `음력 ${leap}${lunar.month}월 ${lunar.day}일`
  } catch {
    return ''
  }
}

export default async function TodayPanel() {
  const session = await auth()
  const userId = parseInt(session?.user?.id ?? '0')
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)

  const [regular, recurringMasters] = await Promise.all([
    prisma.schedule.findMany({
      where: { userId, startAt: { gte: todayStart, lte: todayEnd }, isRecurring: false },
      orderBy: { startAt: 'asc' },
      include: { category: true, tags: { include: { tag: true } } },
    }),
    prisma.schedule.findMany({
      where: { userId, isRecurring: true },
      include: { category: true, recurringRule: true, tags: { include: { tag: true } } },
    }),
  ])

  const recurringToday = recurringMasters
    .filter((m) => m.recurringRule !== null)
    .flatMap((m) => expandRecurringSchedule(m as Parameters<typeof expandRecurringSchedule>[0], todayStart, todayEnd))
    .map((occ) => {
      const master = recurringMasters.find((m) => m.id === occ.scheduleId)!
      return { id: occ.scheduleId, title: occ.title, startAt: occ.startAt, allDay: occ.allDay, color: occ.color, category: master.category }
    })

  const allToday = [
    ...regular.map((s) => ({ id: s.id, title: s.title, startAt: s.startAt, allDay: s.allDay, color: s.color, category: s.category })),
    ...recurringToday,
  ].sort((a, b) => a.startAt.getTime() - b.startAt.getTime())

  const lunarStr = getTodayLunar()

  return (
    <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            오늘의 일정
            <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
              {formatKST(now, 'M월 d일 (E)')}
            </span>
          </h2>
          {lunarStr && (
            <p className="text-xs text-amber-500 dark:text-amber-400 mt-0.5">{lunarStr}</p>
          )}
        </div>
        <span className="text-sm text-slate-400 dark:text-slate-500">{allToday.length}개</span>
      </div>

      {allToday.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">오늘 일정이 없습니다</p>
      ) : (
        <div className="space-y-1">
          {allToday.map((s, i) => (
            <Link
              key={`${s.id}-${i}`}
              href={`/schedules/${s.id}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
            >
              <div
                className="w-1 self-stretch rounded-full flex-shrink-0"
                style={{ backgroundColor: s.color ?? s.category?.color ?? '#6366f1' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {s.title}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {s.allDay ? '하루 종일' : formatKST(s.startAt, 'HH:mm')}
                </p>
              </div>
              <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
