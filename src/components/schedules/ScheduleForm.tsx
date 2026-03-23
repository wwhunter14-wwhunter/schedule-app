'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Category, Tag } from '@prisma/client'
import type { ScheduleWithRelations } from '@/lib/types'
import RecurringRuleFields, { type RecurringData } from './RecurringRuleFields'

const PRESET_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6',
]

const NOTIFY_OPTIONS = [
  { value: '', label: '알림 없음' },
  { value: '5', label: '5분 전' },
  { value: '10', label: '10분 전' },
  { value: '15', label: '15분 전' },
  { value: '30', label: '30분 전' },
  { value: '60', label: '1시간 전' },
  { value: '120', label: '2시간 전' },
  { value: '1440', label: '1일 전' },
]

export type PrefillData = {
  title?: string
  description?: string
  summary?: string
  sourceUrl?: string
  memo?: string
  categoryName?: string
  tagNames?: string[]
  date?: string
}

type Props = {
  schedule?: ScheduleWithRelations
  prefill?: PrefillData
}

function toLocalDatetime(date: Date): string {
  const d = new Date(date)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function initRecurring(schedule?: ScheduleWithRelations): RecurringData {
  if (!schedule?.recurringRule) {
    return { frequency: 'WEEKLY', interval: 1, daysOfWeek: [], endType: 'never', endDate: '', count: 1 }
  }
  const r = schedule.recurringRule
  return {
    frequency: r.frequency,
    interval: r.interval,
    daysOfWeek: r.daysOfWeek ? r.daysOfWeek.split(',') : [],
    endType: r.endDate ? 'date' : r.count ? 'count' : 'never',
    endDate: r.endDate ? new Date(r.endDate).toISOString().split('T')[0] : '',
    count: r.count ?? 1,
  }
}

export default function ScheduleForm({ schedule, prefill }: Props) {
  const router = useRouter()
  const isEdit = !!schedule
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(prefill?.title ?? schedule?.title ?? '')
  const [description, setDescription] = useState(prefill?.description ?? schedule?.description ?? '')
  const [summary, setSummary] = useState(prefill?.summary ?? schedule?.summary ?? '')
  const [sourceUrl, setSourceUrl] = useState(prefill?.sourceUrl ?? schedule?.sourceUrl ?? '')
  const [memo, setMemo] = useState(prefill?.memo ?? schedule?.memo ?? '')
  const [startAt, setStartAt] = useState(() => {
    if (schedule) return toLocalDatetime(schedule.startAt)
    if (prefill?.date) return `${prefill.date}T09:00`
    return toLocalDatetime(new Date())
  })
  const [endAt, setEndAt] = useState(() => {
    if (schedule) return toLocalDatetime(schedule.endAt)
    if (prefill?.date) return `${prefill.date}T10:00`
    return toLocalDatetime(new Date(Date.now() + 3600000))
  })
  const [allDay, setAllDay] = useState(schedule?.allDay ?? false)
  const [color, setColor] = useState(schedule?.color ?? '')
  const [notifyMinutes, setNotifyMinutes] = useState(
    schedule?.notifyMinutes != null ? String(schedule.notifyMinutes) : ''
  )
  const [categoryId, setCategoryId] = useState(
    schedule?.categoryId != null ? String(schedule.categoryId) : ''
  )
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    schedule?.tags.map((t) => t.tagId) ?? []
  )
  const [isRecurring, setIsRecurring] = useState(schedule?.isRecurring ?? false)
  const [recurringData, setRecurringData] = useState<RecurringData>(() => initRecurring(schedule))

  // 파일 첨부 상태
  const [attachmentName, setAttachmentName] = useState(schedule?.attachmentName ?? '')
  const [attachmentPath, setAttachmentPath] = useState(schedule?.attachmentPath ?? '')
  const [attachmentName2, setAttachmentName2] = useState(schedule?.attachmentName2 ?? '')
  const [attachmentPath2, setAttachmentPath2] = useState(schedule?.attachmentPath2 ?? '')
  const [uploading, setUploading] = useState(false)
  const [uploading2, setUploading2] = useState(false)
  const fileInputRef2 = useRef<HTMLInputElement>(null)

  // 태그 인라인 생성 상태
  const [newTagName, setNewTagName] = useState('')

  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/tags').then((r) => r.json()),
    ]).then(async ([cats, tgs]: [Category[], Tag[]]) => {
      setCategories(cats)
      setTags(tgs)

      // prefill: 카테고리 자동 매칭 or 생성
      if (prefill?.categoryName && !schedule) {
        const existing = cats.find((c: Category) => c.name === prefill.categoryName)
        if (existing) {
          setCategoryId(String(existing.id))
        } else {
          const res = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: prefill.categoryName, color: '#6366f1' }),
          })
          if (res.ok) {
            const newCat: Category = await res.json()
            setCategories((prev) => [...prev, newCat])
            setCategoryId(String(newCat.id))
          }
        }
      }

      // prefill: 태그 자동 매칭 or 생성
      if (prefill?.tagNames?.length && !schedule) {
        const newIds: number[] = []
        const updatedTags = [...tgs]
        for (const tagName of prefill.tagNames) {
          const existing = updatedTags.find((t: Tag) => t.name === tagName)
          if (existing) {
            newIds.push(existing.id)
          } else {
            const res = await fetch('/api/tags', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: tagName }),
            })
            if (res.ok) {
              const newTag: Tag = await res.json()
              updatedTags.push(newTag)
              newIds.push(newTag.id)
            }
          }
        }
        setTags(updatedTags)
        setSelectedTagIds(newIds)
      }
    })
  }, [prefill, schedule])

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const text = await res.text()
      let data: { name?: string; path?: string; error?: string } = {}
      try { data = JSON.parse(text) } catch { data = { error: text } }

      if (res.ok && data.path) {
        setAttachmentName(data.name ?? file.name)
        setAttachmentPath(data.path)
      } else {
        setError(data.error ?? `업로드 실패 (${res.status})`)
      }
    } catch (err) {
      setError(`업로드 오류: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setUploading(false)
    }
  }

  const removeAttachment = () => {
    setAttachmentName('')
    setAttachmentPath('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange2 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading2(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const text = await res.text()
      let data: { name?: string; path?: string; error?: string } = {}
      try { data = JSON.parse(text) } catch { data = { error: text } }
      if (res.ok && data.path) {
        setAttachmentName2(data.name ?? file.name)
        setAttachmentPath2(data.path)
      } else {
        setError(data.error ?? `업로드 실패 (${res.status})`)
      }
    } catch (err) {
      setError(`업로드 오류: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setUploading2(false)
    }
  }

  const removeAttachment2 = () => {
    setAttachmentName2('')
    setAttachmentPath2('')
    if (fileInputRef2.current) fileInputRef2.current.value = ''
  }

  const handleAddTag = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const name = newTagName.trim()
    if (!name) return

    // 중복 확인
    const existing = tags.find((t) => t.name === name)
    if (existing) {
      if (!selectedTagIds.includes(existing.id)) {
        setSelectedTagIds((prev) => [...prev, existing.id])
      }
      setNewTagName('')
      return
    }

    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const tag: Tag = await res.json()
      setTags((prev) => [...prev, tag])
      setSelectedTagIds((prev) => [...prev, tag.id])
    }
    setNewTagName('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const body = {
      title,
      description: description || undefined,
      summary: summary || undefined,
      sourceUrl: sourceUrl || undefined,
      memo: memo || undefined,
      attachmentName: attachmentName || undefined,
      attachmentPath: attachmentPath || undefined,
      attachmentName2: attachmentName2 || undefined,
      attachmentPath2: attachmentPath2 || undefined,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
      allDay,
      color: color || undefined,
      notifyMinutes: notifyMinutes ? parseInt(notifyMinutes) : undefined,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      tagIds: selectedTagIds,
      recurring: isRecurring
        ? {
            frequency: recurringData.frequency,
            interval: recurringData.interval,
            daysOfWeek:
              recurringData.frequency === 'WEEKLY' && recurringData.daysOfWeek.length > 0
                ? recurringData.daysOfWeek.join(',')
                : undefined,
            endDate: recurringData.endType === 'date' ? recurringData.endDate : undefined,
            count: recurringData.endType === 'count' ? recurringData.count : undefined,
          }
        : undefined,
    }

    const url = isEdit ? `/api/schedules/${schedule!.id}` : '/api/schedules'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? '저장에 실패했습니다')
      setLoading(false)
      return
    }

    const saved = await res.json()
    router.push(`/schedules/${saved.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 제목 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">제목 *</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          placeholder="일정 제목을 입력하세요"
        />
      </div>

      {/* 링크 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">링크 (URL)</label>
        <input
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          placeholder="https://... (선택)"
        />
      </div>

      {/* 설명 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">설명</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          placeholder="한 줄 설명 (선택)"
        />
      </div>

      {/* 요약 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">요약</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          placeholder="콘텐츠 핵심 요약 (선택)"
        />
      </div>

      {/* 메모 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">메모</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={2}
          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          placeholder="빠른 메모 (선택)"
        />
      </div>

      {/* 파일 첨부 (최대 2개) */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">파일 첨부 <span className="text-slate-400 font-normal">(최대 2개)</span></label>
        <div className="space-y-2">
          {/* 첫 번째 파일 */}
          {attachmentName ? (
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400">📎</span>
              <span className="text-sm text-slate-800 dark:text-slate-200 flex-1 truncate">{attachmentName}</span>
              <button type="button" onClick={removeAttachment} className="text-red-400 hover:text-red-600 text-sm flex-shrink-0">삭제</button>
            </div>
          ) : (
            <div>
              <input ref={fileInputRef} type="file" id="fileUpload" onChange={handleFileChange} className="hidden" />
              <label htmlFor="fileUpload" className={`flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg px-4 py-4 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <span className="text-xl">📎</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{uploading ? '업로드 중...' : '파일 1 선택'}</span>
              </label>
            </div>
          )}
          {/* 두 번째 파일 */}
          {attachmentName2 ? (
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400">📎</span>
              <span className="text-sm text-slate-800 dark:text-slate-200 flex-1 truncate">{attachmentName2}</span>
              <button type="button" onClick={removeAttachment2} className="text-red-400 hover:text-red-600 text-sm flex-shrink-0">삭제</button>
            </div>
          ) : (
            <div>
              <input ref={fileInputRef2} type="file" id="fileUpload2" onChange={handleFileChange2} className="hidden" />
              <label htmlFor="fileUpload2" className={`flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg px-4 py-4 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors ${uploading2 ? 'opacity-50 pointer-events-none' : ''}`}>
                <span className="text-xl">📎</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{uploading2 ? '업로드 중...' : '파일 2 선택'}</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* 하루종일 */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="allDay"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
          className="w-4 h-4 text-indigo-600 rounded"
        />
        <label htmlFor="allDay" className="text-sm font-medium text-slate-700 dark:text-slate-300">하루 종일</label>
      </div>

      {/* 시작/종료 시간 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">시작 *</label>
          <input
            type={allDay ? 'date' : 'datetime-local'}
            required
            value={allDay ? startAt.slice(0, 10) : startAt}
            onChange={(e) => setStartAt(allDay ? `${e.target.value}T00:00` : e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">종료 *</label>
          <input
            type={allDay ? 'date' : 'datetime-local'}
            required
            value={allDay ? endAt.slice(0, 10) : endAt}
            onChange={(e) => setEndAt(allDay ? `${e.target.value}T23:59` : e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* 색상 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">색상</label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(color === c ? '' : c)}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                color === c ? 'border-slate-900 dark:border-slate-100 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* 알림 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">알림</label>
        <select
          value={notifyMinutes}
          onChange={(e) => setNotifyMinutes(e.target.value)}
          className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
        >
          {NOTIFY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* 카테고리 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">카테고리</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
        >
          <option value="">없음</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* 태그 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">태그</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedTagIds.includes(tag.id)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="새 태그 입력 후 Enter"
          className="w-full border border-dashed border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-solid"
        />
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Enter를 누르면 태그가 추가됩니다</p>
      </div>

      {/* 반복 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="recurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded"
          />
          <label htmlFor="recurring" className="text-sm font-medium text-slate-700 dark:text-slate-300">반복 일정</label>
        </div>
        {isRecurring && (
          <RecurringRuleFields value={recurringData} onChange={setRecurringData} />
        )}
      </div>

      {/* 제출 */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || uploading || uploading2}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
        >
          {loading ? '저장 중...' : isEdit ? '수정' : '저장'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 font-medium"
        >
          취소
        </button>
      </div>
    </form>
  )
}
