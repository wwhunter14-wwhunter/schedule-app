import { NextResponse } from 'next/server'

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://schedule-app-v2-khaki.vercel.app'}/api/telegram`

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`)
  const data = await res.json()

  return NextResponse.json(data)
}
