import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId, unauthorized } from '@/lib/session'
import Anthropic from '@anthropic-ai/sdk'

async function fetchYouTubeMeta(url: string) {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
  const res = await fetch(oembedUrl)
  if (!res.ok) return null
  const data = await res.json()

  // YouTube 영상 ID 추출
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  const videoId = match?.[1]

  return {
    title: data.title ?? '',
    author: data.author_name ?? '',
    thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '',
    type: 'youtube' as const,
  }
}

async function fetchWebMeta(url: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ScheduleBot/1.0)' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  const html = await res.text()

  const get = (pattern: RegExp) => html.match(pattern)?.[1]?.trim() ?? ''

  return {
    title: get(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/) ||
           get(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/) ||
           get(/<title>([^<]+)<\/title>/) || '',
    description: get(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/) ||
                 get(/<meta[^>]+content="([^"]+)"[^>]+property="og:description"/) ||
                 get(/<meta[^>]+name="description"[^>]+content="([^"]+)"/) || '',
    siteName: get(/<meta[^>]+property="og:site_name"[^>]+content="([^"]+)"/) || '',
    type: 'web' as const,
  }
}

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return unauthorized()

  const { url } = await request.json()
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL이 필요합니다' }, { status: 400 })
  }

  const isYouTube = /youtube\.com|youtu\.be/.test(url)

  let meta: { title: string; description?: string; author?: string; siteName?: string; type: string } | null = null
  try {
    meta = isYouTube ? await fetchYouTubeMeta(url) : await fetchWebMeta(url)
  } catch {
    return NextResponse.json({ error: 'URL을 가져올 수 없습니다. 주소를 확인해주세요.' }, { status: 400 })
  }

  if (!meta) {
    return NextResponse.json({ error: 'URL에서 정보를 읽을 수 없습니다.' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI 분석 기능이 설정되지 않았습니다.' }, { status: 500 })
  }

  const client = new Anthropic({ apiKey })

  const contextInfo = isYouTube
    ? `유튜브 영상\n제목: ${meta.title}\n채널: ${meta.author}`
    : `웹페이지\n사이트: ${meta.siteName || new URL(url).hostname}\n제목: ${meta.title}\n설명: ${meta.description || '(없음)'}`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `다음 콘텐츠를 일정으로 등록하려 해. 한국어로 분석해서 JSON만 반환해줘.

${contextInfo}
URL: ${url}

반환 형식 (JSON만, 설명 없이):
{
  "title": "일정 제목 (간결하게)",
  "description": "한 줄 설명",
  "memo": "관련 해시태그 3~5개 (#태그 형식) + 짧은 메모",
  "categoryName": "가장 적합한 카테고리 1개 (예: 학습, 업무, 엔터테인먼트, 건강, 요리, 여행, 뉴스 등)",
  "tagNames": ["태그1", "태그2", "태그3"]
}`
    }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()
  let parsed
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch?.[0] ?? raw)
  } catch {
    return NextResponse.json({ error: 'AI 분석 결과를 처리할 수 없습니다.' }, { status: 500 })
  }

  return NextResponse.json({
    title: parsed.title ?? meta.title,
    description: parsed.description ?? '',
    memo: `${parsed.memo ?? ''}\n\n🔗 ${url}`.trim(),
    categoryName: parsed.categoryName ?? '',
    tagNames: parsed.tagNames ?? [],
  })
}
