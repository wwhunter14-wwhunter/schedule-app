import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTelegramMessage } from '@/lib/telegram'

export async function GET(request: NextRequest) {
  const sessionToken = request.nextUrl.searchParams.get('sessionToken')

  if (!sessionToken) {
    return NextResponse.json({ ok: false, error: 'Missing sessionToken' }, { status: 401 })
  }

  const session = await prisma.telegramSession.findUnique({ where: { sessionToken } })
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 })
  }

  const messages = await prisma.$transaction(async (tx) => {
    const unprocessed = await tx.telegramMessage.findMany({
      where: { sessionId: session.id, processed: false },
      orderBy: { createdAt: 'asc' },
    })
    if (unprocessed.length > 0) {
      await tx.telegramMessage.updateMany({
        where: { id: { in: unprocessed.map((m) => m.id) } },
        data: { processed: true },
      })
    }
    return unprocessed
  })

  return NextResponse.json({
    ok: true,
    messages: messages.map((m) => ({ id: m.id, text: m.text, createdAt: m.createdAt })),
  })
}

export async function POST(request: NextRequest) {
  const { sessionToken, reply } = await request.json()

  if (!sessionToken || !reply) {
    return NextResponse.json({ ok: false, error: 'Missing sessionToken or reply' }, { status: 400 })
  }

  const session = await prisma.telegramSession.findUnique({ where: { sessionToken } })
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 })
  }

  await sendTelegramMessage(session.chatId, reply)
  return NextResponse.json({ ok: true })
}
