import { CheckCircle2, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Scene } from '@/types'
import { cn } from '@/lib/cn'
import { LEVEL_LABELS } from '@/content/curriculum'
import { ProgressBar } from './ProgressRing'

export function LevelBadge({ level }: { level: Scene['level'] }) {
  return (
    <span
      className={cn(
        'rounded-md px-1.5 py-0.5 text-2xs font-semibold',
        level === 'A2' && 'bg-success/10 text-success',
        level === 'B1' && 'bg-brand-soft text-brand',
        level === 'B2' && 'bg-warning/10 text-warning',
        level === 'C1' && 'bg-brand-2/10 text-brand-2',
        level === 'C2' && 'bg-ink text-bg',
      )}
    >
      {level} · {LEVEL_LABELS[level]}
    </span>
  )
}

export function SceneCard({
  scene,
  learnedChunks,
  complete,
}: {
  scene: Scene
  learnedChunks: number
  complete: boolean
}) {
  const total = scene.targetChunks.length
  const ratio = total === 0 ? 0 : learnedChunks / total
  return (
    <Link
      to={`/scenes/${scene.id}`}
      className="surface-card press block p-4 hover:border-brand/25"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-[24px]">
          <span aria-hidden>{scene.coverEmoji}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[15.5px] font-bold tracking-tight">
              {scene.titleZh}
            </h3>
            {complete && (
              <CheckCircle2 size={15} className="shrink-0 text-success" />
            )}
          </div>
          <p className="truncate text-[11.5px] text-muted">{scene.titleEn}</p>
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
            {scene.description}
          </p>
        </div>
        <LevelBadge level={scene.level} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {scene.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-surface-2 px-1.5 py-0.5 text-2xs text-muted"
          >
            #{tag}
          </span>
        ))}
        <span className="ml-auto inline-flex items-center gap-0.5 text-2xs text-muted">
          <Clock size={11} />
          {scene.estimatedMinutes} 分钟
        </span>
      </div>

      <div className="mt-2.5 flex items-center gap-2.5">
        <ProgressBar
          value={ratio}
          className="flex-1"
          tone={complete ? 'success' : 'brand'}
          ariaLabel={`${scene.titleZh} 学习进度`}
        />
        <span className="shrink-0 text-2xs tabular-nums text-muted">
          {learnedChunks}/{total} 语块
        </span>
      </div>
    </Link>
  )
}
