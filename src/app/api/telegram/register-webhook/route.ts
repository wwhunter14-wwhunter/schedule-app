import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN이 설정되지 않았습니다' }, { status: 500 })
  }

  const origin = process.env.NEXTAUTH_URL ?? new URL(request.url).origin
  const webhookUrl = `${origin}/api/telegram`

  const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  })
  const data = await res.json()

  return NextResponse.json({ webhookUrl, telegram: data })
}
