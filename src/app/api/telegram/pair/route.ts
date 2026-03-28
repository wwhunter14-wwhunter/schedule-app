import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const { code } = await request.json()

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ ok: false, error: 'Missing code' }, { status: 400 })
  }

  const pairCode = await prisma.telegramPairCode.findUnique({ where: { code } })

  if (!pairCode || pairCode.expiresAt < new Date()) {
    return NextResponse.json({ ok: false, error: 'Invalid or expired code' }, { status: 400 })
  }

  const { chatId } = pairCode

  const session = await prisma.$transaction(async (tx) => {
    await tx.telegramPairCode.delete({ where: { id: pairCode.id } })
    // Delete any existing session for this chat (re-pairing issues a fresh token)
    await tx.telegramSession.deleteMany({ where: { chatId } })
    return tx.telegramSession.create({ data: { chatId } })
  })

  return NextResponse.json({ ok: true, sessionToken: session.sessionToken, chatId: session.chatId })
}
