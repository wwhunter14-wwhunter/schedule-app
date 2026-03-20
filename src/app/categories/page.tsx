'use client'

import { useState, useEffect } from 'react'
import type { Category } from '@prisma/client'

const PRESET_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6',
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [editId, setEditId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchCategories = async () => {
    const res = await fetch('/api/categories')
    setCategories(await res.json())
  }

  useEffect(() => { fetchCategories() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    if (editId) {
      await fetch(`/api/categories/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      })
    } else {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      })
    }

    setName('')
    setColor(PRESET_COLORS[0])
    setEditId(null)
    setLoading(false)
    fetchCategories()
  }

  const handleEdit = (cat: Category) => {
    setEditId(cat.id)
    setName(cat.name)
    setColor(cat.color)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 카테고리를 삭제하시겠습니까?')) return
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    fetchCategories()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">카테고리 관리</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">
          {editId ? '카테고리 수정' : '새 카테고리'}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">이름</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="카테고리 이름"
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">색상</label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    color === c ? 'border-slate-900 dark:border-slate-100 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium text-sm transition-colors"
            >
              {loading ? '저장 중...' : editId ? '수정' : '추가'}
            </button>
            {editId && (
              <button
                type="button"
                onClick={() => { setEditId(null); setName(''); setColor(PRESET_COLORS[0]) }}
                className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 font-medium text-sm transition-colors"
              >
                취소
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="font-medium text-slate-900 dark:text-slate-100">{cat.name}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(cat)}
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                수정
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="px-3 py-1.5 text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
            카테고리가 없습니다. 위에서 추가해보세요.
          </div>
        )}
      </div>
    </div>
  )
}
