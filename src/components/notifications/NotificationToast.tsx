'use client'

import { useEffect } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export type ToastItem = {
  id: number
  title: string
  startAt: string
}

type Props = {
  toast: ToastItem
  onDismiss: (id: number) => void
}

export default function NotificationToast({ toast, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 8000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg dark:shadow-slate-900/50 p-4 flex items-start gap-3 w-72 animate-in slide-in-from-right">
      <span className="text-2xl">🔔</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{toast.title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {format(new Date(toast.startAt), 'M월 d일 HH:mm', { locale: ko })} 시작
        </p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex-shrink-0 transition-colors"
      >
        ✕
      </button>
    </div>
  )
}
