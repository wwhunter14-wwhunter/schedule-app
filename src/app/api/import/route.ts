import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

async function fetchMeta(url: string) {
  const isYouTube = /youtube\.com|youtu\.be/.test(url)
  if (isYouTube) {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
    if (!res.ok) return null
    const data = await res.json()
    return { title: data.title ?? '', author: data.author_name ?? '', type: 'youtube' }
  }
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  const html = await res.text()
  const get = (p: RegExp) => html.match(p)?.[1]?.trim() ?? ''
  return {
    title: get(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/) || get(/<title>([^<]+)<\/title>/) || '',
    description: get(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/) || get(/<meta[^>]+name="description"[^>]+content="([^"]+)"/) || '',
    siteName: get(/<meta[^>]+property="og:site_name"[^>]+content="([^"]+)"/) || '',
    type: 'web',
  }
}

export async function POST(request: NextRequest) {
  const { token, url } = await request.json()
  if (!token || !url) return NextResponse.json({ error: 'token과 url이 필요합니다' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { apiToken: token } })
  if (!user) return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })

  const meta = await fetchMeta(url).catch(() => null)
  if (!meta) return NextResponse.json({ error: 'URL에서 정보를 읽을 수 없습니다' }, { status: 400 })

  const isYouTube = /youtube\.com|youtu\.be/.test(url)
  const contextInfo = isYouTube
    ? `유튜브 영상\n제목: ${meta.title}\n채널: ${(meta as { author?: string }).author ?? ''}`
    : `웹페이지\n제목: ${meta.title}\n설명: ${(meta as { description?: string }).description ?? ''}`

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `다음 콘텐츠를 일정으로 등록할게. 한국어로 분석해서 JSON만 반환해줘.\n\n${contextInfo}\nURL: ${url}\n\n형식:\n{\n  "title": "일정 제목",\n  "description": "한 줄 설명",\n  "summary": "3~5줄 핵심 요약 (정보성 콘텐츠인 경우)",\n  "memo": "해시태그 3~5개",\n  "categoryName": "카테고리 1개",\n  "tagNames": ["태그1", "태그2", "태그3"]\n}`,
    }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()
  let parsed: { title?: string; description?: string; summary?: string; memo?: string; categoryName?: string; tagNames?: string[] }
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch?.[0] ?? raw)
  } catch {
    return NextResponse.json({ error: 'AI 분석 실패' }, { status: 500 })
  }

  // 카테고리 생성/조회
  let categoryId: number | undefined
  if (parsed.categoryName) {
    const existing = await prisma.category.findFirst({ where: { name: parsed.categoryName, userId: user.id } })
    if (existing) {
      categoryId = existing.id
    } else {
      const newCat = await prisma.category.create({ data: { name: parsed.categoryName, color: '#6366f1', userId: user.id } })
      categoryId = newCat.id
    }
  }

  // 태그 생성/조회
  const tagIds: number[] = []
  for (const tagName of parsed.tagNames ?? []) {
    const existing = await prisma.tag.findFirst({ where: { name: tagName, userId: user.id } })
    if (existing) {
      tagIds.push(existing.id)
    } else {
      const newTag = await prisma.tag.create({ data: { name: tagName, userId: user.id } })
      tagIds.push(newTag.id)
    }
  }

  // 일정 생성 (오늘 날짜, 하루 종일)
  const now = new Date()
  const startAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0)
  const endAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0)

  const schedule = await prisma.schedule.create({
    data: {
      userId: user.id,
      title: parsed.title ?? meta.title,
      description: parsed.description ?? '',
      summary: parsed.summary ?? '',
      sourceUrl: url,
      memo: parsed.memo ?? '',
      startAt,
      endAt,
      allDay: false,
      categoryId,
      tags: tagIds.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
    include: { category: true, tags: { include: { tag: true } } },
  })

  return NextResponse.json({
    ok: true,
    schedule: {
      id: schedule.id,
      title: schedule.title,
      description: schedule.description,
      memo: schedule.memo,
      category: schedule.category?.name,
      tags: schedule.tags.map((t) => t.tag.name),
    },
  })
}
