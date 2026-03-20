type RecurringData = {
  frequency: string
  interval: number
  daysOfWeek: string[]
  endType: 'never' | 'date' | 'count'
  endDate: string
  count: number
}

type Props = {
  value: RecurringData
  onChange: (value: RecurringData) => void
}

const DAYS = [
  { key: 'MON', label: '월' },
  { key: 'TUE', label: '화' },
  { key: 'WED', label: '수' },
  { key: 'THU', label: '목' },
  { key: 'FRI', label: '금' },
  { key: 'SAT', label: '토' },
  { key: 'SUN', label: '일' },
]

const FREQ_LABELS: Record<string, string> = {
  DAILY: '일',
  WEEKLY: '주',
  MONTHLY: '달',
  YEARLY: '년',
}

export default function RecurringRuleFields({ value, onChange }: Props) {
  const update = (partial: Partial<RecurringData>) => onChange({ ...value, ...partial })

  const toggleDay = (day: string) => {
    const days = value.daysOfWeek.includes(day)
      ? value.daysOfWeek.filter((d) => d !== day)
      : [...value.daysOfWeek, day]
    update({ daysOfWeek: days })
  }

  return (
    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-700 dark:text-slate-300">매</span>
        <input
          type="number"
          min={1}
          max={99}
          value={value.interval}
          onChange={(e) => update({ interval: parseInt(e.target.value) || 1 })}
          className="w-16 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={value.frequency}
          onChange={(e) => update({ frequency: e.target.value })}
          className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="DAILY">일</option>
          <option value="WEEKLY">주</option>
          <option value="MONTHLY">달</option>
          <option value="YEARLY">년</option>
        </select>
        <span className="text-sm text-slate-700 dark:text-slate-300">마다 반복</span>
      </div>

      {value.frequency === 'WEEKLY' && (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">반복 요일</p>
          <div className="flex gap-1">
            {DAYS.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => toggleDay(d.key)}
                className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                  value.daysOfWeek.includes(d.key)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">종료 조건</p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              checked={value.endType === 'never'}
              onChange={() => update({ endType: 'never' })}
            />
            없음 (무한 반복)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              checked={value.endType === 'date'}
              onChange={() => update({ endType: 'date' })}
            />
            날짜:
            <input
              type="date"
              value={value.endDate}
              onChange={(e) => update({ endDate: e.target.value, endType: 'date' })}
              disabled={value.endType !== 'date'}
              className="border border-slate-300 dark:border-slate-600 rounded px-2 py-0.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              checked={value.endType === 'count'}
              onChange={() => update({ endType: 'count' })}
            />
            <input
              type="number"
              min={1}
              max={999}
              value={value.count}
              onChange={(e) => update({ count: parseInt(e.target.value) || 1, endType: 'count' })}
              disabled={value.endType !== 'count'}
              className="w-16 border border-slate-300 dark:border-slate-600 rounded px-2 py-0.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            회 후 종료
          </label>
        </div>
      </div>
    </div>
  )
}

// Export type for use in parent
export type { RecurringData }
