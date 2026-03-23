'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ScheduleForm, { type PrefillData } from '@/components/schedules/ScheduleForm'

function NewScheduleContent() {
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const [url, setUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [prefill, setPrefill] = useState<PrefillData | null>(
    dateParam ? { date: dateParam } : null
  )
  const [error, setError] = useState('')
  const [formKey, setFormKey] = useState(0)

  const handleAnalyze = async () => {
    if (!url.trim()) return
    setError('')
    setAnalyzing(true)
    try {
      const res = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '분석에 실패했습니다')
      } else {
        setPrefill(data)
        setFormKey((k) => k + 1)
      }
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">새 일정 만들기</h1>

      {/* URL 가져오기 섹션 */}
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔗</span>
          <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">URL로 자동 생성</p>
          <span className="text-xs text-indigo-400 dark:text-indigo-500 ml-auto">YouTube · 웹페이지</span>
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="https://youtube.com/watch?v=... 또는 웹 주소"
            className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !url.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            {analyzing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                분석 중
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                가져오기
              </>
            )}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500 dark:text-red-400">{error}</p>}
        {prefill && !error && (
          <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            자동으로 내용을 채웠어요. 아래에서 수정하세요.
          </p>
        )}
      </div>

      <ScheduleForm key={formKey} prefill={prefill ?? undefined} />
    </div>
  )
}

export default function NewSchedulePage() {
  return (
    <Suspense>
      <NewScheduleContent />
    </Suspense>
  )
}
