/**
 * 양력 → 음력 변환 (한국 음력 기준)
 * korean-lunar-calendar 패키지의 데이터 테이블 기반 순수 JS 구현
 */

// 음력 월별 일수 데이터 (1900~2050)
// 각 연도의 데이터: [윤달위치(0=없음), 1월~12월+윤달 일수 비트팩]
// 실제 계산은 양력 기준 누적 일수 → 음력 변환으로 처리

// 음력 계산을 위한 기준: 1900년 1월 31일 = 음력 1900년 1월 1일
const BASE_SOLAR_YEAR = 1900
const BASE_SOLAR_MONTH = 1
const BASE_SOLAR_DAY = 31

// 각 연도별 음력 데이터
// 형식: 각 숫자는 해당 음력월의 일수 (29 or 30), 맨 앞 숫자는 윤달 위치 (0이면 없음)
// 출처: 천문연구원 기반 데이터
const LUNAR_INFO: number[] = [
  0x04AE53, 0x0A5748, 0x5526BD, 0x0D2650, 0x0D9544, 0x46AAB9, 0x056A4D, 0x09AD42, 0x24AEB6, 0x04AE4A, // 1900~1909
  0x6A4DBE, 0x0A4D52, 0x0D2546, 0x5D52BA, 0x0B544E, 0x0D6A43, 0x296D37, 0x095B4B, 0x749BC1, 0x049754, // 1910~1919
  0x0A4B48, 0x5B25BC, 0x06A550, 0x06D445, 0x4ADAB8, 0x02B64D, 0x095742, 0x2497B7, 0x04974A, 0x664B3E, // 1920~1929
  0x0D4A51, 0x0EA546, 0x56D4BA, 0x05AD4E, 0x02B644, 0x393738, 0x092E4B, 0x7C96BF, 0x0C9553, 0x0D4A48, // 1930~1939
  0x6DA53B, 0x0B554F, 0x056A45, 0x4AADB9, 0x025D4D, 0x092D42, 0x2C95B6, 0x0A954A, 0x7B4ABD, 0x06CA51, // 1940~1949
  0x0B5546, 0x555ABB, 0x04DA4E, 0x0A5B43, 0x352BB8, 0x052B4C, 0x8A953F, 0x0E9552, 0x06AA48, 0x6AD53C, // 1950~1959
  0x0AB54F, 0x04B645, 0x4A5739, 0x0A574D, 0x052642, 0x3E9335, 0x0D9549, 0x75AABE, 0x056A51, 0x096D46, // 1960~1969
  0x54AEBB, 0x04AD4F, 0x0A4D43, 0x4D26B7, 0x0D254B, 0x8D52BF, 0x0B5452, 0x0B6A47, 0x696D3C, 0x095B50, // 1970~1979
  0x049B45, 0x4A4BB9, 0x0A4B4D, 0xAB25C2, 0x06A554, 0x06D449, 0x6ADA3D, 0x0AB651, 0x093746, 0x5497BB, // 1980~1989
  0x04974F, 0x064B44, 0x36A537, 0x0EA54A, 0x86B2BF, 0x05AC53, 0x0AB647, 0x5936BC, 0x092E50, 0x0C9645, // 1990~1999
  0x4D4AB8, 0x0D4A4C, 0x0DA541, 0x25AAB6, 0x056A49, 0x7AADBD, 0x025D52, 0x092D47, 0x5C95BA, 0x0A954E, // 2000~2009
  0x0B4A43, 0x4B5537, 0x0AD54A, 0x955ABF, 0x04BA53, 0x0A5B48, 0x652BBC, 0x052B50, 0x0A9345, 0x474AB9, // 2010~2019
  0x06AA4C, 0x0AD541, 0x24DAB6, 0x04B64A, 0x69573D, 0x0A4E51, 0x0D2646, 0x5E933A, 0x0D534D, 0x05AA43, // 2020~2029
  0x36B537, 0x096D4B, 0xB4AEBF, 0x04AD53, 0x0A4D48, 0x6D25BC, 0x0D254F, 0x0D5244, 0x5DAA38, 0x0B5A4C, // 2030~2039
  0x056D41, 0x46AB36, 0x095B49, 0x9049BE, 0x049751, 0x064B46, 0x66A53A, 0x0EA54D, 0x06B243, 0x492BB7, // 2040~2049
]

function getLunarMonthDays(lunarYear: number, lunarMonth: number): number {
  const idx = lunarYear - BASE_SOLAR_YEAR
  if (idx < 0 || idx >= LUNAR_INFO.length) return 30
  const info = LUNAR_INFO[idx]
  const leapMonth = (info >> 16) & 0xF
  const monthIdx = lunarMonth <= leapMonth && leapMonth > 0 ? lunarMonth - 1 : lunarMonth - 1
  const bit = (info >> (monthIdx + (lunarMonth > leapMonth && leapMonth > 0 ? 1 : 0))) & 1
  return bit ? 30 : 29
}

function solarToJulian(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
}

export function solarToLunar(year: number, month: number, day: number): { year: number; month: number; day: number; isLeap: boolean } {
  // 기준일 (1900년 1월 31일) 의 율리우스력 날짜
  const baseJD = solarToJulian(BASE_SOLAR_YEAR, BASE_SOLAR_MONTH, BASE_SOLAR_DAY)
  const targetJD = solarToJulian(year, month, day)
  let offset = targetJD - baseJD

  let lunarYear = BASE_SOLAR_YEAR
  let lunarMonth = 1
  let leapMonth = 0
  let isLeap = false

  while (lunarYear < 2050) {
    const idx = lunarYear - BASE_SOLAR_YEAR
    if (idx >= LUNAR_INFO.length) break
    const info = LUNAR_INFO[idx]
    leapMonth = (info >> 16) & 0xF

    // 이 해의 총 일수 계산
    let daysInYear = 0
    const months = leapMonth > 0 ? 13 : 12
    for (let m = 1; m <= months; m++) {
      const bit = (info >> (m - 1)) & 1
      daysInYear += bit ? 30 : 29
    }

    if (offset < daysInYear) break
    offset -= daysInYear
    lunarYear++
  }

  // 월 계산
  const idx = lunarYear - BASE_SOLAR_YEAR
  const info = idx < LUNAR_INFO.length ? LUNAR_INFO[idx] : 0
  leapMonth = (info >> 16) & 0xF
  lunarMonth = 1
  isLeap = false

  const months = leapMonth > 0 ? 13 : 12
  for (let m = 0; m < months; m++) {
    const bit = (info >> m) & 1
    const days = bit ? 30 : 29
    if (offset < days) {
      // m번째 달 (윤달 포함 처리)
      if (leapMonth > 0 && m >= leapMonth) {
        lunarMonth = m
        if (m === leapMonth) isLeap = true
      } else {
        lunarMonth = m + 1
      }
      break
    }
    offset -= days
  }

  return { year: lunarYear, month: lunarMonth, day: offset + 1, isLeap }
}

export function getLunarDateStr(date: Date): string {
  try {
    const l = solarToLunar(date.getFullYear(), date.getMonth() + 1, date.getDate())
    return `음력 ${l.isLeap ? '윤' : ''}${l.month}월 ${l.day}일`
  } catch {
    return ''
  }
}
