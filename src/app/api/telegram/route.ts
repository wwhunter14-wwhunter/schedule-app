import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

async function sendMessage(chatId: number | bigint, text: string) {
  if (!BOT_TOKEN) return
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: Number(chatId), text, parse_mode: 'HTML' }),
  }).catch(() => null)
}

async function fetchMeta(url: string) {
  const isYouTube = /youtube\.com|youtu\.be/.test(url)
  if (isYouTube) {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
    if (!res.ok) return null
    const data = await res.json()
    return { title: data.title ?? '', author: data.author_name ?? '', type: 'youtube' as const }
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
    type: 'web' as const,
  }
}

async function handleStart(chatId: number, args: string) {
  const token = args.trim()
  if (!token) {
    await sendMessage(chatId, '사용법: <code>/start 토큰</code>\n\n토큰은 앱 설정 페이지에서 확인할 수 있어요.')
    return
  }

  const user = await prisma.user.findUnique({ where: { apiToken: token } })
  if (!user) {
    await sendMessage(chatId, '❌ 유효하지 않은 토큰입니다. 앱 설정 페이지에서 토큰을 확인해주세요.')
    return
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { telegramChatId: BigInt(chatId) },
  })

  await sendMessage(chatId, `✅ 연동 완료!\n\n이제 URL을 보내면 자동으로 일정이 추가됩니다.`)
}

async function handleUrl(chatId: number, url: string) {
  const user = await prisma.user.findUnique({ where: { telegramChatId: BigInt(chatId) } })
  if (!user) {
    await sendMessage(chatId, '먼저 <code>/start 토큰</code> 으로 계정을 연동해주세요.\n\n토큰은 앱 설정 페이지에서 확인할 수 있어요.')
    return
  }

  await sendMessage(chatId, '⏳ 분석 중...')

  const meta = await fetchMeta(url).catch(() => null)
  if (!meta) {
    await sendMessage(chatId, '❌ URL에서 정보를 읽을 수 없습니다.')
    return
  }

  const isYouTube = meta.type === 'youtube'
  const contextInfo = isYouTube
    ? `유튜브 영상\n제목: ${meta.title}\n채널: ${(meta as { author?: string }).author ?? ''}`
    : `웹페이지\n제목: ${meta.title}\n설명: ${(meta as { description?: string }).description ?? ''}`

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `다음 콘텐츠를 일정으로 등록할게. 한국어로 분석해서 JSON만 반환해줘.\n\n${contextInfo}\nURL: ${url}\n\n형식:\n{\n  "title": "일정 제목",\n  "description": "한 줄 설명",\n  "summary": "핵심 내용을 7~10줄로 자세히 요약. 주요 포인트, 배울 수 있는 내용, 중요한 세부사항 포함. 정보성 콘텐츠가 아니면 빈 문자열.",\n  "memo": "해시태그 3~5개",\n  "categoryName": "카테고리 1개",\n  "tagNames": ["태그1", "태그2", "태그3"]\n}`,
    }],
  }).catch(() => null)

  if (!message) {
    await sendMessage(chatId, '❌ AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요.')
    return
  }

  let parsed: { title?: string; description?: string; summary?: string; memo?: string; categoryName?: string; tagNames?: string[] }
  try {
    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch?.[0] ?? raw)
  } catch {
    await sendMessage(chatId, '❌ AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요.')
    return
  }

  let categoryId: number | undefined
  if (parsed.categoryName) {
    const existing = await prisma.category.findFirst({ where: { name: parsed.categoryName, userId: user.id } })
    categoryId = existing
      ? existing.id
      : (await prisma.category.create({ data: { name: parsed.categoryName, color: '#6366f1', userId: user.id } })).id
  }

  const tagIds: number[] = []
  for (const tagName of parsed.tagNames ?? []) {
    const existing = await prisma.tag.findFirst({ where: { name: tagName, userId: user.id } })
    tagIds.push(existing
      ? existing.id
      : (await prisma.tag.create({ data: { name: tagName, userId: user.id } })).id
    )
  }

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

  const tagList = schedule.tags.map((t) => t.tag.name)
  const lines = [
    `✅ <b>${schedule.title}</b>`,
    schedule.description ? `📌 ${schedule.description}` : '',
    schedule.summary ? `\n${schedule.summary}` : '',
    schedule.category?.name ? `🗂 ${schedule.category.name}` : '',
    tagList.length ? `🏷 ${tagList.join(' ')}` : '',
  ].filter(Boolean).join('\n')

  await sendMessage(chatId, lines)
}

export async function POST(request: NextRequest) {
  if (!BOT_TOKEN) return NextResponse.json({ ok: false }, { status: 500 })

  const update = await request.json().catch(() => null)
  if (!update?.message) return NextResponse.json({ ok: true })

  const chatId: number = update.message.chat.id
  const text: string = update.message.text ?? ''

  if (text.startsWith('/start')) {
    await handleStart(chatId, text.slice(6).trim())
  } else if (/^https?:\/\/\S+/.test(text)) {
    await handleUrl(chatId, text.trim())
  } else {
    await sendMessage(chatId, 'URL을 보내면 자동으로 일정에 추가해드립니다.\n\n처음 사용이라면 <code>/start 토큰</code> 으로 계정을 연동해주세요.')
  }

  return NextResponse.json({ ok: true })
}
