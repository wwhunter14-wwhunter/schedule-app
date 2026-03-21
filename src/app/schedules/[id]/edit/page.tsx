export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import ScheduleForm from '@/components/schedules/ScheduleForm'

export const metadata = { title: '일정 수정' }

export default async function EditSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const userId = parseInt(session?.user?.id ?? '0')
  const { id } = await params
  const schedule = await prisma.schedule.findFirst({
    where: { id: parseInt(id), userId },
    include: {
      category: true,
      recurringRule: true,
      tags: { include: { tag: true } },
    },
  })

  if (!schedule) notFound()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">일정 수정</h1>
      <ScheduleForm schedule={schedule} />
    </div>
  )
}
