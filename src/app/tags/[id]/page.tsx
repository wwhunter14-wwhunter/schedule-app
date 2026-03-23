export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatKST } from '@/lib/formatKST'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import CategoryBadge from '@/components/categories/CategoryBadge'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tag = await prisma.tag.findUnique({ where: { id: parseInt(id) } })
  return { title: tag ? `#${tag.name}` : '태그' }
}

export default async function TagSchedulesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const session = await auth()
  const userId = parseInt(session?.user?.id ?? '0')
  const { id } = await params
  const { q } = await searchParams

  const tag = await prisma.tag.findFirst({ where: { id: parseInt(id), userId } })
  if (!tag) notFound()

  const schedules = await prisma.schedule.findMany({
    where: {
      userId,
      tags: { some: { tagId: parseInt(id) } },
      ...(q ? { title: { contains: q } } : {}),
    },
    orderBy: { startAt: 'desc' },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/tags" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-sm transition-colors">
          ← 태그 목록
        </Link>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">#{tag.name}</h1>
        <span className="text-sm text-slate-400 dark:text-slate-500">{schedules.length}개</span>
      </div>

      {/* 검색창 */}
      <form method="GET" className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder={`#${tag.name} 일정 검색...`}
            className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
          >
            검색
          </button>
          {q && (
            <Link
              href={`/tags/${id}`}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              초기화
            </Link>
          )}
        </div>
      </form>

      {/* 일정 목록 */}
      {schedules.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <p className="text-4xl mb-2">🔍</p>
          <p>{q ? `"${q}"에 해당하는 일정이 없습니다` : '이 태그에 연결된 일정이 없습니다'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map((s) => (
            <Link
              key={s.id}
              href={`/schedules/${s.id}`}
              className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: s.color ?? s.category?.color ?? '#6366f1' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{s.title}</p>
                    {s.isRecurring && <span className="text-xs text-slate-400">↻</span>}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {s.allDay
                      ? formatKST(s.startAt, 'yyyy년 M월 d일 (E)')
                      : formatKST(s.startAt, 'yyyy년 M월 d일 (E) HH:mm')}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {s.category && (
                      <CategoryBadge name={s.category.name} color={s.category.color} />
                    )}
                    {s.tags.map(({ tag: t }) => (
                      <span
                        key={t.id}
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          t.id === parseInt(id)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        #{t.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
