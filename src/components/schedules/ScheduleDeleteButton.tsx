'use client'

import { useRouter } from 'next/navigation'

export default function ScheduleDeleteButton({ id }: { id: number }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return
    await fetch(`/api/schedules/${id}`, { method: 'DELETE' })
    router.push('/calendar')
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-sm font-medium transition-colors"
    >
      삭제
    </button>
  )
}
