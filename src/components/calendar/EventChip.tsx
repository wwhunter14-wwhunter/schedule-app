import Link from 'next/link'
import type { CalendarEvent } from '@/lib/types'

type Props = {
  event: CalendarEvent
  compact?: boolean
}

export default function EventChip({ event, compact = false }: Props) {
  const bg = event.color ?? event.categoryColor ?? '#6366f1'

  return (
    <Link
      href={`/schedules/${event.scheduleId}`}
      className={`block truncate rounded text-white text-xs font-medium px-1.5 hover:opacity-90 transition-opacity ${
        compact ? 'py-0.5' : 'py-1'
      }`}
      style={{ backgroundColor: bg }}
      title={event.title}
    >
      {event.isRecurring && <span className="mr-0.5 opacity-75">↻</span>}
      {event.title}
    </Link>
  )
}
