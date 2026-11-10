export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** 本地时区的 YYYY-MM-DD，避免 toISOString 的 UTC 偏移问题 */
export function toDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function todayKey(): string {
  return toDateKey(new Date())
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function addDays(key: string, days: number): string {
  const date = parseDateKey(key)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

/** to - from，单位天 */
export function diffDays(from: string, to: string): number {
  const a = parseDateKey(from)
  const b = parseDateKey(to)
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((utcB - utcA) / 86_400_000)
}

export function epochDay(key: string): number {
  const date = parseDateKey(key)
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  )
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function weekdayZh(key: string): string {
  return WEEKDAYS[parseDateKey(key).getDay()]
}

/** 11月10日 */
export function formatMonthDay(key: string): string {
  const date = parseDateKey(key)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export function formatDateZh(key: string): string {
  return `${formatMonthDay(key)} · ${weekdayZh(key)}`
}

export function relativeDay(key: string, today = todayKey()): string {
  const diff = diffDays(key, today)
  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  if (diff === 2) return '前天'
  if (diff > 2 && diff < 7) return `${diff} 天前`
  return formatMonthDay(key)
}

export function formatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

export function greeting(date: Date = new Date()): string {
  const hour = date.getHours()
  if (hour < 5) return '夜深了'
  if (hour < 11) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

/** 最近 n 天的日期 key，从旧到新 */
export function recentDateKeys(n: number, end = todayKey()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(end, i - (n - 1)))
}
