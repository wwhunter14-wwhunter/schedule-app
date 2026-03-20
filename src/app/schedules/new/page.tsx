import ScheduleForm from '@/components/schedules/ScheduleForm'

export const metadata = { title: '새 일정' }

export default function NewSchedulePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">새 일정 만들기</h1>
      <ScheduleForm />
    </div>
  )
}
