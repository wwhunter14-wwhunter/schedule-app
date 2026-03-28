import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTelegramMessage } from '@/lib/telegram'
import Anthropic from '@anthropic-ai/sdk'

function extractUrls(text: string): string[] {
  return text.match(/https?:\/\/[^\s]+/g) ?? []
}

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
  const update = await request.json()

  const message = update.message
  if (!message?.text) return NextResponse.json({ ok: true })

  const chatId: number = message.chat.id
  const text: string = message.text
  const chatIdStr = chatId.toString()

  // Check for an active bridge session
  const session = await prisma.telegramSession.findUnique({ where: { chatId: chatIdStr } })
  if (session) {
    await prisma.telegramMessage.create({ data: { sessionId: session.id, text } })
    await sendTelegramMessage(chatId, '⏳ Thinking...')
    return NextResponse.json({ ok: true })
  }

  const urls = extractUrls(text)

  // No session and no URLs — send pairing code
  if (urls.length === 0) {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await prisma.telegramPairCode.create({ data: { code, chatId: chatIdStr, expiresAt } })
    await sendTelegramMessage(
      chatId,
      `Your pairing code is: ${code}\n\nIn Claude Code, run:\n/telegram:access pair ${code}\n\n(Code expires in 10 minutes)`
    )
    return NextResponse.json({ ok: true })
  }

  const apiToken = process.env.TELEGRAM_USER_TOKEN
  const user = await prisma.user.findUnique({ where: { apiToken } })
  if (!user) return NextResponse.json({ ok: true })

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  for (const url of urls) {
    await sendTelegramMessage(chatId, `🔍 분석 중...`)

    try {
      const meta = await fetchMeta(url)
      if (!meta) {
        await sendTelegramMessage(chatId, `❌ URL을 읽을 수 없습니다: ${url}`)
        continue
      }

      const isYouTube = /youtube\.com|youtu\.be/.test(url)
      const contextInfo = isYouTube
        ? `유튜브 영상\n제목: ${meta.title}\n채널: ${(meta as { author?: string }).author ?? ''}`
        : `웹페이지\n제목: ${meta.title}\n설명: ${(meta as { description?: string }).description ?? ''}`

      const aiMessage = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `다음 콘텐츠를 일정으로 등록할게. 한국어로 분석해서 JSON만 반환해줘.\n\n${contextInfo}\nURL: ${url}\n\n형식:\n{\n  "title": "일정 제목",\n  "description": "한 줄 설명",\n  "summary": "핵심 내용을 7~10줄로 자세히 요약. 주요 포인트, 배울 수 있는 내용, 중요한 세부사항 포함. 정보성 콘텐츠가 아니면 빈 문자열.",\n  "memo": "해시태그 3~5개",\n  "categoryName": "카테고리 1개",\n  "tagNames": ["태그1", "태그2", "태그3"]\n}`,
        }],
      })

      const raw = (aiMessage.content[0] as { type: string; text: string }).text.trim()
      let parsed: { title?: string; description?: string; summary?: string; memo?: string; categoryName?: string; tagNames?: string[] }
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        parsed = JSON.parse(jsonMatch?.[0] ?? raw)
      } catch {
        await sendTelegramMessage(chatId, `❌ AI 분석 실패: ${url}`)
        continue
      }

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
      })

      await sendTelegramMessage(chatId, `✅ 일정 등록 완료!\n📌 ${schedule.title}\n🏷️ ${parsed.categoryName ?? '미분류'}`)
    } catch {
      await sendTelegramMessage(chatId, `❌ 오류가 발생했습니다: ${url}`)
    }
  }

  return NextResponse.json({ ok: true })
}
