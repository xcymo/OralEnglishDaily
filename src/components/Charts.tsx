import type { Progress } from '@/types'
import { addDays, parseDateKey, recentDateKeys, weekdayZh } from '@/lib/date'
import { cn } from '@/lib/cn'

export function WeeklyChart({
  activity,
  today,
}: {
  activity: Progress['activity']
  today: string
}) {
  const keys = recentDateKeys(7, today)
  const counts = keys.map((key) => activity[key]?.completed ?? 0)
  const max = Math.max(4, ...counts)
  return (
    <div>
      <div className="flex h-[104px] items-end gap-2">
        {keys.map((key, index) => {
          const count = counts[index]
          const isToday = key === today
          const height = count === 0 ? 5 : Math.max(14, Math.round((count / max) * 78))
          return (
            <div key={key} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={cn(
                  'text-2xs tabular-nums',
                  count > 0 ? 'text-ink' : 'text-transparent',
                )}
              >
                {count}
              </span>
              <div
                className={cn(
                  'w-full rounded-t-md transition-[height] duration-500 ease-soft',
                  count === 0
                    ? 'bg-surface-2'
                    : isToday
                      ? 'bg-brand'
                      : 'bg-brand/25',
                )}
                style={{ height }}
                title={`${key} 完成 ${count} 项`}
              />
              <span
                className={cn(
                  'text-2xs',
                  isToday ? 'font-semibold text-brand' : 'text-muted',
                )}
              >
                {isToday ? '今天' : weekdayZh(key).replace('周', '')}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function Heatmap({
  activity,
  today,
}: {
  activity: Progress['activity']
  today: string
}) {
  // 对齐到周一到周日：展示最近 4 个完整周 + 本周，共 35 格
  const todayDate = parseDateKey(today)
  const mondayOffset = (todayDate.getDay() + 6) % 7
  const thisMonday = addDays(today, -mondayOffset)
  const start = addDays(thisMonday, -28)
  const keys = Array.from({ length: 35 }, (_, index) => addDays(start, index))
  const levelFor = (count: number) => {
    if (count <= 0) return 0
    if (count === 1) return 1
    if (count === 2) return 2
    if (count <= 4) return 3
    return 4
  }
  return (
    <div>
      <div className="mb-1.5 grid grid-cols-7 gap-1.5">
        {['一', '二', '三', '四', '五', '六', '日'].map((label) => (
          <span key={label} className="text-center text-2xs text-muted">
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {keys.map((key) => {
          const count = activity[key]?.completed ?? 0
          const level = levelFor(count)
          const isFuture = key > today
          return (
            <div
              key={key}
              data-date={key}
              title={isFuture ? `${key} · 还没到` : `${key} · 完成 ${count} 项`}
              className={cn(
                'aspect-square rounded-[6px] transition-colors',
                key === today &&
                  'ring-1 ring-brand ring-offset-1 ring-offset-surface',
                isFuture && 'opacity-30',
              )}
              style={{
                backgroundColor:
                  level === 0
                    ? 'rgb(var(--surface-2))'
                    : `rgb(var(--brand) / ${[0, 0.16, 0.32, 0.58, 0.9][level]})`,
              }}
            />
          )
        })}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 text-2xs text-muted">
        <span>少</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className="h-2.5 w-2.5 rounded-[3px]"
            style={{
              backgroundColor:
                level === 0
                  ? 'rgb(var(--surface-2))'
                  : `rgb(var(--brand) / ${[0, 0.16, 0.32, 0.58, 0.9][level]})`,
            }}
          />
        ))}
        <span>多</span>
      </div>
    </div>
  )
}
