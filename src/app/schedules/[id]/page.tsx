export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatKST, toKSTDateString } from '@/lib/formatKST'
import { prisma } from '@/lib/prisma'
import CategoryBadge from '@/components/categories/CategoryBadge'
import ScheduleDeleteButton from '@/components/schedules/ScheduleDeleteButton'
import LinkifiedText from '@/components/LinkifiedText'
import AttachmentViewer from '@/components/AttachmentViewer'
import { auth } from '@/auth'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const schedule = await prisma.schedule.findUnique({ where: { id: parseInt(id) } })
  return { title: schedule?.title ?? '일정 상세' }
}

export default async function ScheduleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const userId = parseInt(session?.user?.id ?? '0')
  const { id } = await params
  const schedule = await prisma.schedule.findFirst({
    where: { id: parseInt(id), userId },
    include: {
      category: true,
      recurringRule: true,
      tags: { include: { tag: true } },
    },
  })

  if (!schedule) notFound()

  const FREQ_LABEL: Record<string, string> = {
    DAILY: '매일',
    WEEKLY: '매주',
    MONTHLY: '매달',
    YEARLY: '매년',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 뒤로가기 */}
      <div className="mb-4">
        <Link href="/calendar" className="inline-flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          캘린더로 돌아가기
        </Link>
      </div>

      {/* 헤더 카드 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 mb-4 flex items-start gap-4">
        {/* 컬러 바 */}
        <div
          className="w-1.5 self-stretch rounded-full flex-shrink-0 mt-0.5"
          style={{ backgroundColor: schedule.color ?? schedule.category?.color ?? '#6366f1' }}
        />
        {/* 제목/카테고리 */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug">{schedule.title}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {schedule.category && <CategoryBadge name={schedule.category.name} color={schedule.category.color} />}
            {schedule.isRecurring && <span className="text-xs text-slate-400 dark:text-slate-500">↻ 반복</span>}
          </div>
        </div>
        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link
            href={`/schedules/${schedule.id}/edit`}
            title="수정"
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </Link>
          <ScheduleDeleteButton id={schedule.id} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-slate-400 mt-0.5">📅</span>
          <div>
            {schedule.allDay ? (
              <p className="text-slate-900 dark:text-slate-100">
                {formatKST(schedule.startAt, 'yyyy년 M월 d일 (E)')}
                {toKSTDateString(schedule.startAt) !== toKSTDateString(schedule.endAt) &&
                  ` ~ ${formatKST(schedule.endAt, 'M월 d일 (E)')}`}
              </p>
            ) : (
              <p className="text-slate-900 dark:text-slate-100">
                {formatKST(schedule.startAt, 'yyyy년 M월 d일 (E) HH:mm')} ~{' '}
                {formatKST(schedule.endAt, 'HH:mm')}
              </p>
            )}
          </div>
        </div>

        {schedule.sourceUrl && (
          <div className="flex items-start gap-3">
            <span className="text-slate-400 mt-0.5">🔗</span>
            <a
              href={schedule.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm break-all"
            >
              {schedule.sourceUrl}
            </a>
          </div>
        )}

        {schedule.description && (
          <div className="flex items-start gap-3">
            <span className="text-slate-400 mt-0.5">📝</span>
            <LinkifiedText text={schedule.description} className="text-slate-700 dark:text-slate-300" preserveNewlines />
          </div>
        )}

        {schedule.summary && (
          <div className="flex items-start gap-3">
            <span className="text-slate-400 mt-0.5">📋</span>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/50 rounded-lg px-3 py-2 flex-1">
              {schedule.summary}
            </p>
          </div>
        )}

        {schedule.memo && (
          <div className="flex items-start gap-3">
            <span className="text-slate-400 mt-0.5">🗒️</span>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg px-3 py-2 flex-1">
              {schedule.memo}
            </p>
          </div>
        )}

        {schedule.attachmentName && schedule.attachmentPath && (
          <div className="flex items-start gap-3">
            <span className="text-slate-400 mt-0.5 pt-2">📎</span>
            <AttachmentViewer name={schedule.attachmentName} path={schedule.attachmentPath} />
          </div>
        )}

        {schedule.notifyMinutes != null && (
          <div className="flex items-start gap-3">
            <span className="text-slate-400 mt-0.5">🔔</span>
            <p className="text-slate-700 dark:text-slate-300">
              {schedule.notifyMinutes < 60
                ? `${schedule.notifyMinutes}분 전 알림`
                : schedule.notifyMinutes === 1440
                ? '1일 전 알림'
                : `${schedule.notifyMinutes / 60}시간 전 알림`}
            </p>
          </div>
        )}

        {schedule.isRecurring && schedule.recurringRule && (
          <div className="flex items-start gap-3">
            <span className="text-slate-400 mt-0.5">🔁</span>
            <div className="text-slate-700 dark:text-slate-300">
              <p>
                {FREQ_LABEL[schedule.recurringRule.frequency]} {schedule.recurringRule.interval > 1 ? `(${schedule.recurringRule.interval}${schedule.recurringRule.frequency === 'DAILY' ? '일' : schedule.recurringRule.frequency === 'WEEKLY' ? '주' : schedule.recurringRule.frequency === 'MONTHLY' ? '달' : '년'}마다)` : ''} 반복
              </p>
              {schedule.recurringRule.daysOfWeek && (
                <p className="text-sm text-slate-500 dark:text-slate-400">{schedule.recurringRule.daysOfWeek}</p>
              )}
              {schedule.recurringRule.endDate && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formatKST(schedule.recurringRule.endDate, 'yyyy년 M월 d일')} 까지
                </p>
              )}
            </div>
          </div>
        )}

        {schedule.tags.length > 0 && (
          <div className="flex items-start gap-3">
            <span className="text-slate-400 mt-0.5">🏷️</span>
            <div className="flex flex-wrap gap-1">
              {schedule.tags.map(({ tag }) => (
                <Link
                  key={tag.id}
                  href={`/tags/${tag.id}`}
                  className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
