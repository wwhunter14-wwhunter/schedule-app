'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Category, Tag } from '@prisma/client'

export default function ScheduleSearchBar({
  categories,
  tags,
  defaultQ,
  defaultCategoryId,
  defaultTagId,
}: {
  categories: Category[]
  tags: Tag[]
  defaultQ: string
  defaultCategoryId: string
  defaultTagId: string
}) {
  const router = useRouter()
  const [q, setQ] = useState(defaultQ)
  const [categoryId, setCategoryId] = useState(defaultCategoryId)
  const [tagId, setTagId] = useState(defaultTagId)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (categoryId) params.set('categoryId', categoryId)
    if (tagId) params.set('tagId', tagId)
    router.push(`/schedules?${params.toString()}`)
  }

  const handleReset = () => {
    setQ('')
    setCategoryId('')
    setTagId('')
    router.push('/schedules')
  }

  return (
    <form onSubmit={handleSearch} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="제목, 설명, 메모 검색..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl font-medium transition-colors"
        >
          검색
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="flex-1 min-w-[140px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">전체 카테고리</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={tagId}
          onChange={(e) => setTagId(e.target.value)}
          className="flex-1 min-w-[140px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">전체 태그</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>#{t.name}</option>
          ))}
        </select>

        {(defaultQ || defaultCategoryId || defaultTagId) && (
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            초기화
          </button>
        )}
      </div>
    </form>
  )
}
