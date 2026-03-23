import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const year = parseInt(searchParams.get('year') ?? '0')
  const month = parseInt(searchParams.get('month') ?? '0')
  const day = parseInt(searchParams.get('day') ?? '0')

  if (!year || !month || !day) {
    return NextResponse.json({ lunarStr: '' })
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const KoreanLunarCalendar = require('korean-lunar-calendar')
    const cal = new KoreanLunarCalendar()
    cal.setSolarDate(year, month, day)
    const l = cal.getLunarCalendar()
    const lunarStr = `음력 ${l.intercalation ? '윤' : ''}${l.month}월 ${l.day}일`
    return NextResponse.json({ lunarStr })
  } catch {
    return NextResponse.json({ lunarStr: '' })
  }
}
