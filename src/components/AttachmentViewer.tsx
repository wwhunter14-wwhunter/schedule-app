'use client'

import { useState } from 'react'

type Props = {
  name: string
  path: string
}

function getFileType(name: string): 'image' | 'pdf' | 'video' | 'other' {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video'
  return 'other'
}

export default function AttachmentViewer({ name, path }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [lightbox, setLightbox] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const type = getFileType(name)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(path)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex-1">
      {/* 파일 헤더 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
        <span className="text-lg">
          {type === 'image' ? '🖼️' : type === 'pdf' ? '📄' : type === 'video' ? '🎬' : '📎'}
        </span>
        <span className="text-sm text-slate-800 dark:text-slate-200 font-medium flex-1 truncate">{name}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* 열기 버튼 (이미지/PDF/동영상은 토글, 그 외 새 탭) */}
          {type === 'other' ? (
            <a
              href={path}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              열기
            </a>
          ) : (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              {expanded ? '닫기' : '열기'}
            </button>
          )}
          {/* 다운로드 버튼 */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {downloading ? '...' : '다운로드'}
          </button>
        </div>
      </div>

      {/* 인라인 미리보기 */}
      {expanded && (
        <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          {type === 'image' && (
            <>
              <img
                src={path}
                alt={name}
                className="w-full max-h-96 object-contain bg-slate-100 dark:bg-slate-800 cursor-zoom-in"
                onClick={() => setLightbox(true)}
              />
              <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-1">클릭하면 크게 볼 수 있습니다</p>
            </>
          )}
          {type === 'pdf' && (
            <object
              data={path}
              type="application/pdf"
              className="w-full"
              style={{ height: '70vh' }}
            >
              <div className="flex flex-col items-center justify-center py-10 gap-3 bg-slate-50 dark:bg-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">브라우저에서 PDF를 표시할 수 없습니다.</p>
                <a
                  href={path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                >
                  새 탭에서 열기
                </a>
              </div>
            </object>
          )}
          {type === 'video' && (
            <video
              src={path}
              controls
              className="w-full max-h-96 bg-black"
            />
          )}
        </div>
      )}

      {/* 이미지 라이트박스 */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-3 py-1.5 text-sm text-white border border-white/40 rounded hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              {downloading ? '...' : '다운로드'}
            </button>
            <button
              className="text-white text-3xl leading-none hover:opacity-70"
              onClick={() => setLightbox(false)}
            >
              ✕
            </button>
          </div>
          <img
            src={path}
            alt={name}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
