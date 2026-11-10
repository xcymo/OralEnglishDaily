import {
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Mic,
  Repeat2,
  RotateCcw,
  Users,
} from 'lucide-react'
import type { DailyTask, TaskType } from '@/types'
import { cn } from '@/lib/cn'
import { Chip } from './Chip'

export const TASK_META: Record<
  TaskType,
  { label: string; icon: typeof BookOpen; tile: string }
> = {
  'scene-learn': {
    label: '学新场景',
    icon: BookOpen,
    tile: 'bg-brand-soft text-brand',
  },
  'pattern-substitute': {
    label: '替换造句',
    icon: Repeat2,
    tile: 'bg-brand-2/10 text-brand-2',
  },
  shadow: {
    label: '跟读',
    icon: Mic,
    tile: 'bg-warning/10 text-warning',
  },
  roleplay: {
    label: '角色扮演',
    icon: Users,
    tile: 'bg-success/10 text-success',
  },
  review: {
    label: '复习',
    icon: RotateCcw,
    tile: 'bg-surface-2 text-muted',
  },
}

export function TaskIcon({
  type,
  size = 'md',
  className,
}: {
  type: TaskType
  size?: 'sm' | 'md'
  className?: string
}) {
  const meta = TASK_META[type]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-2xl',
        size === 'sm' ? 'h-9 w-9 rounded-xl' : 'h-11 w-11',
        meta.tile,
        className,
      )}
      aria-hidden
    >
      <Icon size={size === 'sm' ? 16 : 20} />
    </span>
  )
}

export function TaskTagBadge({ tag }: { tag: DailyTask['tag'] }) {
  if (tag === 'new') return <Chip static tone="brand">新学</Chip>
  if (tag === 'review') return <Chip static tone="warning">复习</Chip>
  return <Chip static>加练</Chip>
}

export function TaskCard({
  task,
  onOpen,
  disabled,
}: {
  task: DailyTask
  onOpen: () => void
  disabled?: boolean
}) {
  const done = task.status === 'done'
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={done || disabled}
      aria-label={`${done ? '已完成：' : ''}${task.title}，预计 ${task.estimatedMinutes} 分钟`}
      className={cn(
        'surface-card press flex w-full items-start gap-3 p-3.5 text-left transition-opacity',
        done ? 'opacity-60' : 'hover:border-brand/25',
      )}
    >
      <TaskIcon type={task.type} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <TaskTagBadge tag={task.tag} />
          <span className="inline-flex items-center gap-0.5 text-2xs text-muted">
            <Clock size={11} />
            {task.estimatedMinutes} 分钟
          </span>
        </div>
        <p
          className={cn(
            'mt-1 truncate text-[14.5px] font-semibold tracking-tight',
            done && 'text-muted',
          )}
        >
          {task.title}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[12px] text-muted">
          {done && task.selfRating
            ? `已完成 · 自评 ${task.selfRating.fluency}/5`
            : task.description}
        </p>
      </div>
      <span
        className={cn(
          'mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
          done
            ? 'border-success bg-success text-white'
            : 'border-line text-muted',
        )}
        aria-hidden
      >
        {done ? <Check size={14} strokeWidth={3} /> : <ChevronRight size={14} />}
      </span>
    </button>
  )
}
