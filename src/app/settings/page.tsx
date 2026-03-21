'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // API 토큰 상태
  const [apiToken, setApiToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/me/token').then(r => r.json()).then(d => setApiToken(d.token))
  }, [])

  const generateToken = async () => {
    setTokenLoading(true)
    const res = await fetch('/api/me/token', { method: 'POST' })
    const data = await res.json()
    setApiToken(data.token)
    setTokenLoading(false)
  }

  const revokeToken = async () => {
    if (!confirm('토큰을 삭제하면 연동된 기능이 작동하지 않습니다. 삭제하시겠습니까?')) return
    await fetch('/api/me/token', { method: 'DELETE' })
    setApiToken(null)
  }

  const copyToken = () => {
    if (!apiToken) return
    navigator.clipboard.writeText(apiToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '오류가 발생했습니다')
      } else {
        setSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 fade-in">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-8">회원정보 수정</h1>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-5">비밀번호 변경</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">현재 비밀번호</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="현재 비밀번호 입력"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">새 비밀번호</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="새 비밀번호 (4자 이상)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">새 비밀번호 확인</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="새 비밀번호 다시 입력"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {success && (
            <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
              비밀번호가 변경되었습니다. 다음 로그인 시 새 비밀번호를 사용하세요.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {loading ? '저장 중...' : '저장'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      </div>

      {/* API 토큰 섹션 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mt-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">API 토큰</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">텔레그램에서 URL을 보내면 자동으로 일정을 추가하는 데 사용해요.</p>

        {apiToken ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
              <code className="flex-1 text-xs text-slate-700 dark:text-slate-300 font-mono truncate">{apiToken}</code>
              <button onClick={copyToken} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium whitespace-nowrap hover:underline">
                {copied ? '복사됨 ✓' : '복사'}
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={generateToken} disabled={tokenLoading} className="flex-1 py-2 text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors disabled:opacity-50">
                재발급
              </button>
              <button onClick={revokeToken} className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl font-medium transition-colors">
                삭제
              </button>
            </div>
          </div>
        ) : (
          <button onClick={generateToken} disabled={tokenLoading} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
            {tokenLoading ? '생성 중...' : '토큰 생성'}
          </button>
        )}
      </div>
    </div>
  )
}
