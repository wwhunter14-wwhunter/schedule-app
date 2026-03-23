/**
 * 대한민국 공휴일 (양력 고정 + 음력 계산)
 */
import { LUNAR_MONTH_STARTS } from './lunarDate'

// 양력 고정 공휴일 (MM-DD: 이름)
const FIXED_HOLIDAYS: Record<string, string> = {
  '01-01': '신정',
  '03-01': '삼일절',
  '05-05': '어린이날',
  '06-06': '현충일',
  '08-15': '광복절',
  '10-03': '개천절',
  '10-09': '한글날',
  '12-25': '성탄절',
}

function solarIntToDate(solarInt: number): Date {
  const y = Math.floor(solarInt / 10000)
  const m = Math.floor((solarInt % 10000) / 100) - 1
  const d = solarInt % 100
  return new Date(y, m, d)
}

function toKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

// 음력 기반 공휴일 계산
const LUNAR_HOLIDAYS: Record<string, string> = {}

for (const [solar, , lunarMonth, isLeap] of LUNAR_MONTH_STARTS) {
  if (isLeap) continue
  const base = solarIntToDate(solar)

  if (lunarMonth === 1) {
    // 설날: 전날(음력 12/30), 당일(1/1), 다음날(1/2)
    LUNAR_HOLIDAYS[toKey(addDays(base, -1))] = '설날 전날'
    LUNAR_HOLIDAYS[toKey(base)] = '설날'
    LUNAR_HOLIDAYS[toKey(addDays(base, 1))] = '설날 다음날'
  }
  if (lunarMonth === 4) {
    // 부처님오신날: 음력 4월 8일
    LUNAR_HOLIDAYS[toKey(addDays(base, 7))] = '부처님오신날'
  }
  if (lunarMonth === 8) {
    // 추석: 음력 8월 14·15·16일
    LUNAR_HOLIDAYS[toKey(addDays(base, 13))] = '추석 전날'
    LUNAR_HOLIDAYS[toKey(addDays(base, 14))] = '추석'
    LUNAR_HOLIDAYS[toKey(addDays(base, 15))] = '추석 다음날'
  }
}

export function getHolidayName(date: Date): string | null {
  const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  if (FIXED_HOLIDAYS[mmdd]) return FIXED_HOLIDAYS[mmdd]
  return LUNAR_HOLIDAYS[toKey(date)] ?? null
}
