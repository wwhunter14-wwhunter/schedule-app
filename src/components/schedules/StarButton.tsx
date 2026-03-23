'use client'

import { useState } from 'react'

export default function StarButton({ id, isImportant: initial, size = 'md' }: { id: number; isImportant: boolean; size?: 'sm' | 'md' }) {
  const [isImportant, setIsImportant] = useState(initial)
  const [loading, setLoading] = useState(false)

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/schedules/${id}/important`, { method: 'POST' })
      const data = await res.json()
      setIsImportant(data.isImportant)
    } finally {
      setLoading(false)
    }
  }

  const s = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  const iconSize = size === 'sm' ? 14 : 18

  return (
    <button
      onClick={toggle}
      title={isImportant ? '중요 해제' : '중요 표시'}
      className={`${s} flex items-center justify-center rounded-full transition-colors ${
        isImportant
          ? 'text-amber-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30'
          : 'text-slate-300 dark:text-slate-600 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30'
      }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize}
        fill={isImportant ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        viewBox="0 0 24 24">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </button>
  )
}
