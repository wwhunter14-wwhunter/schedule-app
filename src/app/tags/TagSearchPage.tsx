'use client'

import { useState } from 'react'
import Link from 'next/link'

type Tag = {
  id: number
  name: string
  _count: { schedules: number }
}

export default function TagSearchPage({ tags }: { tags: Tag[] }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? tags.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : tags

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">태그</h1>

      {/* 검색창 */}
      <div className="relative mb-6">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="태그 이름으로 검색..."
          className="w-full pl-9 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        )}
      </div>

      {tags.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <p className="text-4xl mb-2">🏷️</p>
          <p>등록된 태그가 없습니다</p>
          <Link
            href="/schedules/new"
            className="mt-3 inline-block text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 text-sm"
          >
            일정 만들면서 태그 추가하기 →
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <p className="text-4xl mb-2">🔍</p>
          <p>
            <span className="font-medium text-slate-700 dark:text-slate-300">"{query}"</span>에 해당하는 태그가 없습니다
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {filtered.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
            >
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">#{tag.name}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">
                {tag._count.schedules}
              </span>
            </Link>
          ))}
        </div>
      )}

      {query && filtered.length > 0 && (
        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          {filtered.length}개 태그 검색됨
        </p>
      )}
    </div>
  )
}
