import type { Metadata } from 'next'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import Navbar from '@/components/layout/Navbar'
import NotificationProvider from '@/components/notifications/NotificationProvider'

export const metadata: Metadata = {
  title: { default: '일정 관리', template: '%s | 일정 관리' },
  description: '일정을 관리하는 공간',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-200">
        <ThemeProvider>
          <NotificationProvider>
            <Navbar />
            <main>{children}</main>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
