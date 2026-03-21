import Link from 'next/link'
import { format } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import CategoryBadge from '@/components/categories/CategoryBadge'
import ScheduleSearchBar from '@/components/schedules/ScheduleSearchBar'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const metadata = { title: '일정 검색' }

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoryId?: string; tagId?: string }>
}) {
  const session = await auth()
  const userId = parseInt(session?.user?.id ?? '0')
  const { q, categoryId, tagId } = await searchParams

  const andConditions: Prisma.ScheduleWhereInput[] = [{ userId }]
  if (q) andConditions.push({ OR: [{ title: { contains: q } }, { description: { contains: q } }, { memo: { contains: q } }] })
  if (categoryId) andConditions.push({ categoryId: parseInt(categoryId) })
  if (tagId) andConditions.push({ tags: { some: { tagId: parseInt(tagId) } } })
  const where: Prisma.ScheduleWhereInput = { AND: andConditions }

  const [schedules, categories, tags] = await Promise.all([
    prisma.schedule.findMany({ where, orderBy: { startAt: 'desc' }, take: 50, include: { category: true, tags: { include: { tag: true } } } }),
    prisma.category.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
    prisma.tag.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">일정 검색</h1>
        <Link href="/schedules/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm shadow-sm transition-colors">+ 새 일정</Link>
      </div>
      <ScheduleSearchBar categories={categories} tags={tags} defaultQ={q ?? ''} defaultCategoryId={categoryId ?? ''} defaultTagId={tagId ?? ''} />
      <div className="mt-4 text-sm text-slate-500 dark:text-slate-400 mb-3">{schedules.length}개의 일정</div>
      {schedules.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-400 dark:text-slate-500 text-sm">조건에 맞는 일정이 없습니다</div>
      ) : (
        <div className="space-y-2">
          {schedules.map((s) => (
            <div key={s.id} className="flex items-start gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all">
              <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: s.color ?? s.category?.color ?? '#6366f1' }} />
              <Link href={`/schedules/${s.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{s.title}</p>
                  {s.isRecurring && <span className="text-xs text-slate-400">↻</span>}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{format(s.startAt, 'yyyy.MM.dd')} {s.allDay ? '(하루 종일)' : format(s.startAt, 'HH:mm')}</p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {s.category && <CategoryBadge name={s.category.name} color={s.category.color} />}
                  {s.tags.map(({ tag }) => <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">#{tag.name}</span>)}
                </div>
              </Link>
              <div className="flex items-center gap-1 flex-shrink-0">
                {s.sourceUrl && (
                  <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" title="원본 링크 열기" className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                )}
                <Link href={`/schedules/${s.id}`} className="w-8 h-8 flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
