import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Pattern } from '@/types'
import { functionCategoryEmoji, functionCategoryLabel } from '@/content'
import { PatternText } from './PatternText'
import { LevelBadge } from './SceneCard'

export function PatternCard({
  pattern,
  learned,
  mastered,
}: {
  pattern: Pattern
  learned: boolean
  mastered: boolean
}) {
  return (
    <Link
      to={`/patterns/${pattern.id}`}
      className="surface-card press block p-4 hover:border-brand/25"
    >
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-2xs font-medium text-muted">
          <span aria-hidden>{functionCategoryEmoji(pattern.functionCategory)}</span>
          {functionCategoryLabel(pattern.functionCategory)}
        </span>
        <LevelBadge level={pattern.level} />
        {learned && !mastered && (
          <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-2xs font-medium text-brand">
            学过
          </span>
        )}
        {mastered && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-success/10 px-1.5 py-0.5 text-2xs font-semibold text-success">
            <CheckCircle2 size={11} />
            已掌握
          </span>
        )}
      </div>
      <p className="mt-2 text-[16px] font-semibold leading-snug tracking-tight">
        <PatternText text={pattern.patternEn} />
      </p>
      <p className="mt-0.5 text-[12.5px] text-muted">{pattern.patternZh}</p>
      <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-muted/90">
        {pattern.usageNote}
      </p>
    </Link>
  )
}
