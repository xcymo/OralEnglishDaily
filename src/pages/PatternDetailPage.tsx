import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Languages,
  MapPin,
} from 'lucide-react'
import {
  functionCategoryEmoji,
  functionCategoryLabel,
  getPattern,
  scenesUsingPattern,
} from '@/content'
import { useProgress } from '@/store/progress'
import { isPatternMastered } from '@/lib/complete'
import { PageHeader } from '@/components/PageHeader'
import { PatternText } from '@/components/PatternText'
import { SpeakButton } from '@/components/SpeakButton'
import { LevelBadge } from '@/components/SceneCard'
import { Chip } from '@/components/Chip'
import { Button } from '@/components/Button'
import { Card, SectionTitle } from '@/components/Card'
import { EmptyState } from '@/components/Skeleton'

export default function PatternDetailPage() {
  const { patternId } = useParams()
  const pattern = getPattern(patternId)
  const navigate = useNavigate()
  const { progress, plan } = useProgress()

  if (!pattern) {
    return (
      <div className="px-4 pt-safe">
        <PageHeader back title="句式" />
        <div className="mt-6">
          <EmptyState
            icon={<Languages size={20} />}
            title="找不到这个句式"
            description="内容可能已经更新，回句式库看看。"
            action={<Button onClick={() => navigate('/patterns')}>回句式库</Button>}
          />
        </div>
      </div>
    )
  }

  const mastered = isPatternMastered(progress, pattern.id)
  const learned = progress.learnedPatternIds.includes(pattern.id)
  const relatedScenes = scenesUsingPattern(pattern.id)
  const stat = progress.patternStats[pattern.id]
  const spoken = pattern.patternEn.replace(/\[|\]/g, '')
  const planTask = plan.tasks.find(
    (task) =>
      task.status === 'pending' &&
      task.type === 'pattern-substitute' &&
      task.patternIds?.includes(pattern.id),
  )

  return (
    <div className="min-h-dvh pb-action">
      <PageHeader
        back
        actions={
          <span className="rounded-md bg-surface-2 px-2 py-1 text-2xs font-medium text-muted">
            {functionCategoryEmoji(pattern.functionCategory)}{' '}
            {functionCategoryLabel(pattern.functionCategory)}
          </span>
        }
      />

      <div className="px-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <LevelBadge level={pattern.level} />
          {mastered ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-1.5 py-0.5 text-2xs font-semibold text-success">
              <CheckCircle2 size={11} /> 已掌握
            </span>
          ) : learned ? (
            <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-2xs font-medium text-brand">
              学过 · 继续巩固
            </span>
          ) : (
            <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-2xs text-muted">
              还没练过
            </span>
          )}
          {stat && (
            <span className="text-2xs text-muted">
              练过 {stat.attempts} 次 · 最近自评 {stat.lastRating}/5
            </span>
          )}
        </div>

        <div className="mt-3">
          <p className="text-[25px] font-bold leading-[1.35] tracking-tight">
            <PatternText text={pattern.patternEn} />
          </p>
          <p className="mt-2 text-[14.5px] text-muted">{pattern.patternZh}</p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <SpeakButton text={spoken} variant="pill" label="听示范" />
          {pattern.substitutions.length > 0 && (
            <Chip static>
              {pattern.substitutions.length} 种替换说法
            </Chip>
          )}
        </div>

        <Card className="mt-4 p-4">
          <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-muted">
            什么时候用
          </p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed">{pattern.usageNote}</p>
        </Card>

        <section className="mt-5">
          <SectionTitle>例句</SectionTitle>
          <div className="space-y-2">
            {pattern.examples.map((example) => (
              <div
                key={example.en}
                className="surface-card flex items-start gap-2 p-3"
              >
                <SpeakButton text={example.en} label="播放例句" />
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[13.5px] font-medium leading-snug">
                    {example.en}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted">{example.zh}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {pattern.substitutions.length > 0 && (
          <section className="mt-5">
            <SectionTitle
              action={<span className="text-2xs text-muted">括号里换成它</span>}
            >
              替换练习
            </SectionTitle>
            <div className="surface-card divide-y divide-line">
              {pattern.substitutions.map((sub) => (
                <div key={sub.en} className="flex items-center gap-3 px-3.5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium">{sub.zh}</p>
                    <p className="text-[12px] text-brand">{sub.en}</p>
                  </div>
                  <SpeakButton text={sub.en} label="播放替换说法" />
                </div>
              ))}
            </div>
          </section>
        )}

        {relatedScenes.length > 0 && (
          <section className="mt-5">
            <SectionTitle>出现在这些场景</SectionTitle>
            <div className="space-y-2">
              {relatedScenes.map((scene) => (
                <Link
                  key={scene.id}
                  to={`/scenes/${scene.id}`}
                  className="surface-card press flex items-center gap-2.5 p-3"
                >
                  <span className="text-xl" aria-hidden>
                    {scene.coverEmoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold">{scene.titleZh}</p>
                    <p className="truncate text-2xs text-muted">{scene.titleEn}</p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-muted" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-5 flex flex-wrap gap-1.5">
          {pattern.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-surface-2 px-2 py-1 text-2xs text-muted"
            >
              #{tag}
            </span>
          ))}
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-2xs text-muted/70">
          <MapPin size={11} />
          同一个句式可以被多个场景引用，练的是「能力」而不是单个场景。
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center">
        <div className="w-full max-w-[520px] border-t border-line bg-bg/95 px-4 pb-safe-bottom-fixed pt-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold">
                {planTask ? '今天计划里的句式' : '换三种说法，说顺它'}
              </p>
              <p className="text-2xs text-muted">约 3 分钟 · 可以录音</p>
            </div>
            <Button
              size="lg"
              onClick={() =>
                navigate(
                  planTask
                    ? `/practice/task/${planTask.id}`
                    : `/practice/pattern/${pattern.id}`,
                )
              }
              iconRight={<ArrowRight size={17} />}
            >
              {planTask ? '开始今日任务' : '替换造句'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
