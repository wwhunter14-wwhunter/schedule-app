'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { requestNotificationPermission } from '@/lib/notifications'
import NotificationToast, { type ToastItem } from './NotificationToast'

// 탭 간 중복 알림 방지용 BroadcastChannel
const notifChannel = typeof window !== 'undefined' ? new BroadcastChannel('schedule-notifications') : null

function fireNotification(swReg: ServiceWorkerRegistration | null, title: string, body: string, tag: string) {
  if (Notification.permission !== 'granted') return
  if (swReg) {
    // Service Worker를 통해 OS 알림 표시 (백그라운드 탭에서도 동작)
    swReg.showNotification(title, { body, tag, icon: '/favicon.ico', requireInteraction: false })
  } else {
    new Notification(title, { body, tag, requireInteraction: false })
  }
}

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [showBanner, setShowBanner] = useState(false)
  const seenIds = useRef(new Set<number>())
  const swReg = useRef<ServiceWorkerRegistration | null>(null)

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

        // 다른 탭에도 알림 ID 브로드캐스트해서 중복 방지
        notifChannel?.postMessage({ type: 'SEEN', id: item.id })

        // In-app toast
        setToasts((prev) => [...prev, item])

        // OS 알림 (SW 경유)
        fireNotification(swReg.current, item.title, `${item.title} 일정이 곧 시작됩니다`, String(item.id))
      }
    } catch {
      // Silent fail for polling
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 다른 탭에서 본 알림 ID 동기화
    if (notifChannel) {
      notifChannel.onmessage = (e) => {
        if (e.data?.type === 'SEEN') seenIds.current.add(e.data.id)
      }
    }

    // Service Worker 등록
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        swReg.current = reg
      }).catch(() => {/* SW 미지원 환경 무시 */})
    }

    // 알림 권한 배너
    if ('Notification' in window && Notification.permission === 'default') {
      if (!localStorage.getItem('notif_dismissed')) setShowBanner(true)
    }

    poll()
    const interval = setInterval(poll, 60_000)

    // 탭이 다시 포커스될 때 즉시 폴링 (놓친 알림 즉시 체크)
    const handleVisible = () => { if (document.visibilityState === 'visible') poll() }
    document.addEventListener('visibilitychange', handleVisible)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisible)
    }
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
