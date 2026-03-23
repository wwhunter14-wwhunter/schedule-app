import { format as formatFns } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { ko } from 'date-fns/locale'

const TZ = 'Asia/Seoul'

export function formatKST(date: Date | string, fmt: string) {
  return formatInTimeZone(new Date(date), TZ, fmt, { locale: ko })
}

// toDateString 비교용: KST 날짜를 YYYY-MM-DD 문자열로
export function toKSTDateString(date: Date | string) {
  return formatInTimeZone(new Date(date), TZ, 'yyyy-MM-dd')
}
