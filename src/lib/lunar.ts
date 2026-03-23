// eslint-disable-next-line @typescript-eslint/no-require-imports
const KoreanLunarCalendar = require('korean-lunar-calendar')

export function getLunarDate(date: Date): string {
  const cal = new KoreanLunarCalendar()
  cal.setSolarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
  const lunar: { year: number; month: number; day: number; intercalation: boolean } =
    cal.lunarCalendar
  return `음력 ${lunar.month}.${String(lunar.day).padStart(2, '0')}`
}
