import { Link } from 'react-router-dom'
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Flame,
  History,
  MessageSquareText,
  RotateCcw,
  Star,
} from 'lucide-react'
import type { ReviewItem } from '@/types'
import { getPattern, getScene } from '@/content'
import { currentStreak, masteredPatternCount } from '@/lib/complete'
import { diffDays, formatTime, recentDateKeys, relativeDay } from '@/lib/date'
import { isDue } from '@/lib/srs'
import { useProgress } from '@/store/progress'
import { Card, SectionTitle } from '@/components/Card'
import { WeeklyChart, Heatmap } from '@/components/Charts'
import { TaskIcon } from '@/components/TaskBits'
import { RecordingsSection } from '@/components/RecordingsPanel'
import { StuckNotesPanel } from '@/components/StuckNotesPanel'
import { EmptyState } from '@/components/Skeleton'
import { cn } from '@/lib/cn'

function StatTile({
  icon,
  label,
  value,
  suffix,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  suffix?: string
  tone: string
}) {
  return (
    <div className="surface-card p-3.5">
      <span
        className={cn(
          'mb-2 flex h-8 w-8 items-center justify-center rounded-xl',
          tone,
        )}
      >
        {icon}
      </span>
      <p className="text-[24px] font-extrabold leading-none tracking-tight">
        {value}
        {suffix && (
          <span className="ml-0.5 text-[12px] font-medium text-muted">{suffix}</span>
        )}
      </p>
      <p className="mt-1 text-2xs text-muted">{label}</p>
    </div>
  )
}

function ReviewRow({ item, today }: { item: ReviewItem; today: string }) {
  const scene = item.kind === 'scene' ? getScene(item.refId) : undefined
  const pattern = item.kind === 'pattern' ? getPattern(item.refId) : undefined
  const title = scene?.titleZh ?? pattern?.patternZh ?? item.refId
  const to = scene ? `/scenes/${scene.id}` : pattern ? `/patterns/${pattern.id}` : '/'
  const due = isDue(item, today)
  const daysLeft = diffDays(today, item.dueDate)
  return (
    <Link
      to={to}
      className="flex min-h-[44px] items-center gap-2 rounded-xl bg-surface-2/60 px-2.5 py-2 press"
    >
      <span className="shrink-0 rounded bg-surface px-1.5 py-0.5 text-2xs text-muted">
        {item.kind === 'scene' ? '场景' : '句式'}
      </span>
      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
        {title}
      </span>
      <span
        className={cn(
          'shrink-0 text-2xs',
          due ? 'font-semibold text-warning' : 'text-muted',
        )}
      >
        {due ? '该复习了' : daysLeft > 0 ? `${daysLeft} 天后` : '今天'}
      </span>
      <ChevronRight size={14} className="shrink-0 text-muted" />
    </Link>
  )
}

export default function ProgressPage() {
  const { progress, today } = useProgress()
  const streak = currentStreak(progress, today)
  const mastered = masteredPatternCount(progress)
  const weekKeys = recentDateKeys(7, today)
  const weekMinutes = weekKeys.reduce(
    (sum, key) => sum + (progress.activity[key]?.minutes ?? 0),
    0,
  )
  const dueItems = progress.reviewQueue.filter((item) => isDue(item, today))
  const queue = [...progress.reviewQueue].sort(
    (a, b) => a.dueDate.localeCompare(b.dueDate) || a.lastRating - b.lastRating,
  )
  const recent = progress.history.slice(0, 8)

  return (
    <div className="px-4 pb-8 pt-safe">
      <div className="pt-3">
        <h1 className="text-[27px] font-extrabold leading-tight tracking-tight">
          我的进度
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          记录只在本机。每天开口的那几分钟，都算数。
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <StatTile
          icon={<Flame size={16} className="text-warning" />}
          label="连续打卡"
          value={streak}
          suffix="天"
          tone="bg-warning/10"
        />
        <StatTile
          icon={<CheckCircle2 size={16} className="text-success" />}
          label="累计完成任务"
          value={progress.completedTaskIds.length}
          suffix="项"
          tone="bg-success/10"
        />
        <StatTile
          icon={<Star size={16} className="text-brand" />}
          label="掌握句式"
          value={mastered}
          suffix={`/ ${progress.learnedPatternIds.length} 学过`}
          tone="bg-brand-soft"
        />
        <StatTile
          icon={<BookOpen size={16} className="text-brand-2" />}
          label="学完场景"
          value={progress.learnedSceneIds.length}
          suffix="个"
          tone="bg-brand-2/10"
        />
      </div>

      <Card className="mt-3 p-4">
        <SectionTitle
          action={
            <span className="text-2xs text-muted">共 {weekMinutes} 分钟</span>
          }
        >
          近 7 天
        </SectionTitle>
        <WeeklyChart activity={progress.activity} today={today} />
      </Card>

      <Card className="mt-3 p-4">
        <SectionTitle
          action={<span className="text-2xs text-muted">最近 5 周</span>}
        >
          练习热力
        </SectionTitle>
        <Heatmap activity={progress.activity} today={today} />
      </Card>

      <section className="mt-5">
        <SectionTitle
          action={
            <span className="text-2xs font-medium text-brand">
              {dueItems.length > 0 ? `今天 ${dueItems.length} 项` : '暂无到期'}
            </span>
          }
        >
          复习队列
        </SectionTitle>
        <Card className="p-3.5">
          <div className="mb-2.5 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <RotateCcw size={15} />
            </span>
            <p className="text-[12px] leading-relaxed text-muted">
              按 1 / 3 / 7 / 14 / 30 天间隔安排，自评低的内容会更早回来。
            </p>
          </div>
          {queue.length === 0 ? (
            <p className="py-2 text-[12.5px] text-muted">
              完成第一个学习任务后，这里会出现复习安排。
            </p>
          ) : (
            <div className="space-y-1.5">
              {queue.slice(0, 4).map((item) => (
                <ReviewRow key={item.key} item={item} today={today} />
              ))}
            </div>
          )}
        </Card>
      </section>

      <RecordingsSection today={today} />

      <StuckNotesPanel today={today} />

      <section className="mt-5">
        <SectionTitle>最近练习</SectionTitle>
        {recent.length === 0 ? (
          <EmptyState
            icon={<History size={19} />}
            title="还没有练习记录"
            description="完成今天第一个任务，这里就会亮起来。"
            className="py-7"
          />
        ) : (
          <div className="surface-card divide-y divide-line">
            {recent.map((record) => (
              <div key={`${record.taskId}-${record.completedAt}`} className="flex items-center gap-2.5 px-3.5 py-2.5">
                <TaskIcon type={record.type} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{record.title}</p>
                  <p className="text-2xs text-muted">
                    {relativeDay(record.date, today)} {formatTime(record.completedAt)}
                    {record.extra && ' · 加练'}
                  </p>
                </div>
                {record.rating && (
                  <div className="shrink-0 text-right">
                    <p className="text-[12px] font-semibold text-brand">
                      {record.rating.fluency}/5
                    </p>
                    <p className="text-2xs text-muted">流利度</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 flex items-center justify-center gap-1.5 text-2xs text-muted/70">
        <MessageSquareText size={12} />
        卡壳越多，清单越准。别怕说错。
      </div>
    </div>
  )
}
