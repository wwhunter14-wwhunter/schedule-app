'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { requestNotificationPermission, fireNativeNotification } from '@/lib/notifications'
import NotificationToast, { type ToastItem } from './NotificationToast'

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [showBanner, setShowBanner] = useState(false)
  const seenIds = useRef(new Set<number>())

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const poll = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const items: ToastItem[] = await res.json()

      for (const item of items) {
        if (seenIds.current.has(item.id)) continue
        seenIds.current.add(item.id)

        // In-app toast
        setToasts((prev) => [...prev, item])

        // Browser notification
        fireNativeNotification(item.title, `${item.title} 일정이 곧 시작됩니다`, String(item.id))
      }
    } catch {
      // Silent fail for polling
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if we should show the permission banner
    if ('Notification' in window && Notification.permission === 'default') {
      const dismissed = localStorage.getItem('notif_dismissed')
      if (!dismissed) {
        setShowBanner(true)
      }
    }

    poll()
    const interval = setInterval(poll, 60_000)
    return () => clearInterval(interval)
  }, [poll])

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission()
    setShowBanner(false)
    if (!granted) {
      localStorage.setItem('notif_dismissed', '1')
    }
  }

  const handleDismissBanner = () => {
    setShowBanner(false)
    localStorage.setItem('notif_dismissed', '1')
  }

  return (
    <>
      {children}

      {/* 알림 허용 배너 */}
      {showBanner && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-indigo-50 dark:bg-indigo-950/90 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4 shadow-lg dark:shadow-slate-900/50 z-50">
          <p className="text-sm text-indigo-900 dark:text-indigo-100 font-medium">일정 알림 허용</p>
          <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1 mb-3">
            일정 시작 전에 브라우저 알림을 받으실 수 있습니다
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleEnableNotifications}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 font-medium transition-colors"
            >
              허용
            </button>
            <button
              onClick={handleDismissBanner}
              className="px-3 py-1.5 text-indigo-600 dark:text-indigo-400 text-xs hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              다음에
            </button>
          </div>
        </div>
      )}

      {/* 토스트 알림 */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
          {toasts.map((t) => (
            <NotificationToast key={t.id} toast={t} onDismiss={dismissToast} />
          ))}
        </div>
      )}
    </>
  )
}
