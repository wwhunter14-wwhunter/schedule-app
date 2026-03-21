// Service Worker for schedule-app notifications
const CACHE_NAME = 'schedule-app-v1'
const channel = new BroadcastChannel('schedule-notifications')

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// 페이지에서 알림 메시지를 받아 OS 알림으로 표시
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = event.data
    if (Notification.permission === 'granted') {
      self.registration.showNotification(title, {
        body,
        tag,
        icon: '/favicon.ico',
        requireInteraction: false,
      })
    }
  }
})

// 알림 클릭 시 앱 창 포커스
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow('/')
    })
  )
})
