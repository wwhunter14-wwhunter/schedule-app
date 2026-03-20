export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { prisma } from '@/lib/prisma'
import CategoryBadge from '@/components/categories/CategoryBadge'
import ScheduleDeleteButton from '@/components/schedules/ScheduleDeleteButton'
import LinkifiedText from '@/components/LinkifiedText'
import AttachmentViewer from '@/components/AttachmentViewer'

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
  const { id } = await params
  const schedule = await prisma.schedule.findUnique({
    where: { id: parseInt(id) },
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
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          {schedule.color && (
            <div
              className="w-1 h-full min-h-[2.5rem] rounded-full flex-shrink-0"
              style={{ backgroundColor: schedule.color }}
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{schedule.title}</h1>
            {schedule.category && (
              <div className="mt-1">
                <CategoryBadge name={schedule.category.name} color={schedule.category.color} />
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/schedules/${schedule.id}/edit`}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium transition-colors"
          >
            수정
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
                {format(schedule.startAt, 'yyyy년 M월 d일 (E)', { locale: ko })}
                {schedule.startAt.toDateString() !== schedule.endAt.toDateString() &&
                  ` ~ ${format(schedule.endAt, 'M월 d일 (E)', { locale: ko })}`}
              </p>
            ) : (
              <p className="text-slate-900 dark:text-slate-100">
                {format(schedule.startAt, 'yyyy년 M월 d일 (E) HH:mm', { locale: ko })} ~{' '}
                {format(schedule.endAt, 'HH:mm', { locale: ko })}
              </p>
            )}
          </div>
        </div>

        {schedule.description && (
          <div className="flex items-start gap-3">
            <span className="text-slate-400 mt-0.5">📝</span>
            <LinkifiedText text={schedule.description} className="text-slate-700 dark:text-slate-300" preserveNewlines />
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
                  {format(schedule.recurringRule.endDate, 'yyyy년 M월 d일', { locale: ko })} 까지
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

      <div className="mt-4">
        <Link href="/calendar" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm">
          ← 캘린더로 돌아가기
        </Link>
      </div>
    </div>
  )
}
