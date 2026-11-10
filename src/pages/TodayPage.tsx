import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  Play,
  Sparkles,
} from 'lucide-react'
import { formatDateZh, greeting } from '@/lib/date'
import { currentStreak } from '@/lib/complete'
import { loadLabel, planProgress } from '@/lib/planner'
import { content } from '@/content'
import { useProgress } from '@/store/progress'
import { ProgressRing } from '@/components/ProgressRing'
import { Button } from '@/components/Button'
import { Card, SectionTitle } from '@/components/Card'
import { TaskCard } from '@/components/TaskBits'
import { Chip } from '@/components/Chip'
import { EmptyState } from '@/components/Skeleton'

export default function TodayPage() {
  const { progress, plan, today } = useProgress()
  const navigate = useNavigate()
  const stats = planProgress(plan)
  const streak = currentStreak(progress, today)
  const allDone = stats.total > 0 && stats.done === stats.total
  const ratio = stats.total === 0 ? 0 : stats.done / stats.total

  const start = () => {
    if (allDone) {
      navigate('/scenes')
      return
    }
    if (stats.nextTask) {
      navigate(`/practice/task/${stats.nextTask.id}`)
    }
  }

  return (
    <div className="px-4 pb-8 pt-safe">
      <header className="flex items-center justify-between gap-3 pt-3">
        <p className="text-[12px] font-medium text-muted">
          {formatDateZh(today)} · {greeting()}
        </p>
        <Link
          to="/progress"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-pill border border-line bg-surface px-3 text-[12px] font-semibold text-ink shadow-card"
          aria-label={`连续打卡 ${streak} 天，查看进度`}
        >
          <Flame size={14} className="text-warning" fill="currentColor" />
          {streak > 0 ? `${streak} 天` : '开始第一天'}
        </Link>
      </header>

      <div className="mt-2">
        <h1 className="text-[27px] font-extrabold leading-tight tracking-tight text-balance">
          今天，开口说英语
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          每天一点，把想说的句子练到脱口而出。
        </p>
      </div>

      <Card className="mt-4 p-4">
        <div className="flex items-center gap-4">
          <ProgressRing
            value={ratio}
            size={86}
            label={`今日完成 ${stats.done} / ${stats.total}`}
          >
            <span className="text-[21px] font-extrabold leading-none">
              {stats.done}
            </span>
            <span className="mt-0.5 text-2xs text-muted">/ {stats.total} 项</span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="text-[15.5px] font-bold tracking-tight">
              {allDone
                ? '今天的任务完成了 🎉'
                : stats.done > 0
                  ? '已经开始了，继续保持'
                  : '今天的第一句，从哪开始？'}
            </p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
              {allDone
                ? '明天会自动安排新内容，也可以去场景库加练。'
                : stats.total === 0
                  ? '内容库还没有加载到可用内容。'
                  : `还剩约 ${stats.remainingMinutes} 分钟，共 ${stats.total} 个小任务。`}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip static tone="brand">
                {loadLabel(plan.load)}
              </Chip>
              <Chip static>
                <Clock size={11} />
                {stats.minutes} 分钟
              </Chip>
            </div>
          </div>
        </div>
        <Button
          fullWidth
          size="lg"
          className="mt-4"
          onClick={start}
          disabled={stats.total === 0}
          icon={allDone ? <Sparkles size={18} /> : <Play size={17} fill="currentColor" />}
        >
          {allDone
            ? '去场景库加练'
            : stats.done > 0
              ? '继续练习'
              : stats.total === 0
                ? '暂无任务'
                : '开始今日练习'}
        </Button>
      </Card>

      {allDone && (
        <Card className="mt-3 flex items-center gap-3 border-success/20 bg-success/[0.06] p-3.5">
          <CheckCircle2 size={22} className="shrink-0 text-success" />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold">今日打卡完成</p>
            <p className="text-2xs text-muted">
              连续 {streak} 天 · 累计完成 {progress.completedTaskIds.length} 项
            </p>
          </div>
        </Card>
      )}

      <div className="mt-5">
        <SectionTitle
          action={
            <span className="text-2xs text-muted">
              {stats.done}/{stats.total}
            </span>
          }
        >
          今日任务
        </SectionTitle>

        {plan.tasks.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={20} />}
            title="今天没有任务"
            description="内容文件里还没有可用场景。把场景 JSON 放进 src/content/scenes 即可。"
          />
        ) : (
          <div className="space-y-2.5">
            {plan.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onOpen={() => navigate(`/practice/task/${task.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <Link
        to="/scenes"
        className="press mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-line bg-surface/50 p-3.5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <Sparkles size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold">想多说一点？</p>
          <p className="text-2xs text-muted">
            去场景库挑一个场景，随时加练
          </p>
        </div>
        <ArrowRight size={17} className="shrink-0 text-muted" />
      </Link>

      <p className="mt-5 text-center text-2xs text-muted/70">
        {content.scenes.length} 个场景 · {content.patterns.length} 个可迁移句式
      </p>
    </div>
  )
}
