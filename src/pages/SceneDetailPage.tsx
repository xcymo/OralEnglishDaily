import { useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Play,
  Users,
} from 'lucide-react'
import { getScene, functionCategoryEmoji, functionCategoryLabel, getPattern } from '@/content'
import { cn } from '@/lib/cn'
import { useProgress } from '@/store/progress'
import { PageHeader } from '@/components/PageHeader'
import { Card, SectionTitle } from '@/components/Card'
import { ProgressBar } from '@/components/ProgressRing'
import { LevelBadge } from '@/components/SceneCard'
import { Chip } from '@/components/Chip'
import { Button } from '@/components/Button'
import { SpeakButton } from '@/components/SpeakButton'
import { PatternText } from '@/components/PatternText'
import { Sheet } from '@/components/Sheet'
import { EmptyState } from '@/components/Skeleton'

export default function SceneDetailPage() {
  const { sceneId } = useParams()
  const scene = getScene(sceneId)
  const navigate = useNavigate()
  const { progress, plan } = useProgress()
  const [expanded, setExpanded] = useState<string[]>([])
  const [scriptOpen, setScriptOpen] = useState(false)

  const patterns = useMemo(
    () =>
      (scene?.targetPatterns ?? [])
        .map((id) => getPattern(id))
        .filter((pattern): pattern is NonNullable<typeof pattern> => Boolean(pattern)),
    [scene],
  )

  if (!scene) {
    return (
      <div className="px-4 pt-safe">
        <PageHeader back title="场景" />
        <div className="mt-6">
          <EmptyState
            icon={<Users size={20} />}
            title="找不到这个场景"
            description="内容可能已经更新，回场景库看看。"
            action={<Button onClick={() => navigate('/scenes')}>回场景库</Button>}
          />
        </div>
      </div>
    )
  }

  const learned = progress.learnedChunkIds[scene.id] ?? []
  const learnedSet = new Set(learned)
  const total = scene.targetChunks.length
  const complete = learned.length >= total && total > 0
  const ratio = total === 0 ? 0 : learned.length / total
  // 今天计划里正好有这个场景时，优先进入计划任务，避免自己练一遍又把计划重复一遍
  const planTask = plan.tasks.find(
    (task) =>
      task.status === 'pending' &&
      task.type === 'scene-learn' &&
      task.sceneId === scene.id,
  )

  const toggle = (chunkId: string) => {
    setExpanded((prev) =>
      prev.includes(chunkId) ? prev.filter((id) => id !== chunkId) : [...prev, chunkId],
    )
  }

  return (
    <div className="min-h-dvh pb-action">
      <PageHeader
        back
        actions={<Chip static>{scene.category}</Chip>}
        className="px-0"
      />

      <div className="px-4">
        <div className="flex items-start gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-surface-2 text-[32px]">
            <span aria-hidden>{scene.coverEmoji}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[23px] font-extrabold leading-tight tracking-tight">
              {scene.titleZh}
            </h1>
            <p className="text-[12px] text-muted">{scene.titleEn}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <LevelBadge level={scene.level} />
              <span className="inline-flex items-center gap-0.5 rounded-md bg-surface-2 px-1.5 py-0.5 text-2xs text-muted">
                <Clock size={10} />
                {scene.estimatedMinutes} 分钟
              </span>
              {complete && (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-success/10 px-1.5 py-0.5 text-2xs font-semibold text-success">
                  <CheckCircle2 size={10} /> 已学完
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
          {scene.description}
        </p>

        <div className="mt-3 flex items-center gap-2.5">
          <ProgressBar
            value={ratio}
            tone={complete ? 'success' : 'brand'}
            ariaLabel={`已学 ${learned.length} / ${total} 个语块`}
            className="flex-1"
          />
          <span className="shrink-0 text-2xs tabular-nums text-muted">
            {learned.length}/{total} 语块
          </span>
        </div>

        <Card className="mt-4 border-brand/15 bg-brand-soft/40 p-4">
          <div className="flex items-center gap-2">
            <Users size={17} className="text-brand" />
            <h2 className="text-[14.5px] font-bold">角色扮演</h2>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            {scene.roleplay.promptZh}
          </p>
          {scene.roleplay.goals.length > 0 && (
            <ul className="mt-2 space-y-1">
              {scene.roleplay.goals.map((goal) => (
                <li
                  key={goal}
                  className="flex items-start gap-1.5 text-[12.5px] leading-relaxed text-muted"
                >
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand" />
                  {goal}
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => setScriptOpen(true)}
          >
            查看对话脚本
          </Button>
        </Card>

        <section className="mt-5">
          <SectionTitle action={<span className="text-2xs text-muted">{total} 个</span>}>
            目标语块
          </SectionTitle>
          <div className="space-y-2">
            {scene.targetChunks.map((chunk) => {
              const isLearned = learnedSet.has(chunk.id)
              const isOpen = expanded.includes(chunk.id)
              return (
                <div key={chunk.id} className="surface-card px-3.5 py-3">
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => toggle(chunk.id)}
                      aria-expanded={isOpen}
                      className="min-h-[44px] min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-start gap-1.5">
                        {isLearned && (
                          <CheckCircle2
                            size={14}
                            className="mt-0.5 shrink-0 text-success"
                          />
                        )}
                        <p className="text-[14.5px] font-semibold leading-snug">
                          {chunk.en}
                        </p>
                      </div>
                      <p className="mt-0.5 text-[12.5px] text-muted">{chunk.zh}</p>
                    </button>
                    <SpeakButton text={chunk.en} label="播放语块" />
                    <span
                      className="flex h-11 w-6 shrink-0 items-center justify-center text-muted"
                      aria-hidden
                    >
                      <ChevronDown
                        size={15}
                        className={cn('transition-transform', isOpen && 'rotate-180')}
                      />
                    </span>
                  </div>
                  {isOpen && (
                    <div className="mt-2 animate-fade-up border-t border-line pt-2.5">
                      {chunk.note && (
                        <p className="text-[12.5px] leading-relaxed text-muted">
                          {chunk.note}
                        </p>
                      )}
                      {chunk.exampleEn && (
                        <div className="mt-2 rounded-xl bg-surface-2 p-2.5">
                          <p className="text-[12.5px] leading-relaxed">
                            {chunk.exampleEn}
                          </p>
                          <p className="mt-0.5 text-2xs text-muted">
                            {chunk.exampleZh}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {scene.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-surface-2 px-2 py-1 text-2xs text-muted"
            >
              #{tag}
            </span>
          ))}
        </div>

        <section className="mt-5">
          <SectionTitle
            action={
              <Link
                to="/patterns"
                className="min-h-[44px] text-2xs font-medium text-brand"
              >
                全部句式
              </Link>
            }
          >
            可迁移句式
          </SectionTitle>
          {patterns.length > 0 ? (
            <div className="space-y-2">
              {patterns.map((pattern) => (
                <Link
                  key={pattern.id}
                  to={`/patterns/${pattern.id}`}
                  className="surface-card press flex items-center gap-2.5 p-3"
                >
                  <span className="shrink-0 rounded-md bg-surface-2 px-1.5 py-0.5 text-2xs text-muted">
                    {functionCategoryEmoji(pattern.functionCategory)}{' '}
                    {functionCategoryLabel(pattern.functionCategory)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug">
                      <PatternText text={pattern.patternEn} />
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-2xs text-muted">{pattern.patternZh}</p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-muted" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="surface-card p-3.5 text-[12.5px] leading-relaxed text-muted">
              这个场景暂时没有关联句式。
              <Link
                to="/patterns"
                className="ml-1 font-medium text-brand underline decoration-brand/30 underline-offset-4"
              >
                去句式库看看
              </Link>
            </div>
          )}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center">
        <div className="w-full max-w-[520px] border-t border-line bg-bg/95 px-4 pb-safe-bottom-fixed pt-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold">
                {complete
                  ? '已学完，可以再练一遍'
                  : planTask
                    ? '今天的学习任务'
                    : learned.length > 0
                      ? `还剩 ${total - learned.length} 个语块`
                      : '从第一个语块开始'}
              </p>
              <p className="text-2xs text-muted">预计约 {scene.estimatedMinutes} 分钟</p>
            </div>
            <Button
              size="lg"
              onClick={() =>
                navigate(
                  planTask
                    ? `/practice/task/${planTask.id}`
                    : `/practice/scene/${scene.id}`,
                )
              }
              icon={<Play size={16} fill="currentColor" />}
            >
              {planTask
                ? '开始今日任务'
                : learned.length > 0
                  ? '继续练习'
                  : '开始练习'}
            </Button>
          </div>
        </div>
      </div>

      <Sheet
        open={scriptOpen}
        onClose={() => setScriptOpen(false)}
        title={`${scene.titleZh} · 对话脚本`}
        description="轮到你时先自己说，再对照下面的示范。"
      >
        <div className="space-y-2">
          {scene.roleplay.script.map((line, index) => (
            <div
              key={`${line.en}-${index}`}
              className={cn(
                'rounded-xl border p-2.5',
                line.speaker === 'you'
                  ? 'border-brand/20 bg-brand-soft/40'
                  : 'border-line bg-surface-2/50',
              )}
            >
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    'mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-2xs font-semibold',
                    line.speaker === 'you'
                      ? 'bg-brand text-on-brand'
                      : 'bg-surface text-muted',
                  )}
                >
                  {line.speaker === 'you' ? '你' : '对方'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-snug">{line.en}</p>
                  <p className="mt-0.5 text-2xs text-muted">{line.zh}</p>
                </div>
                <SpeakButton text={line.en} label="播放台词" />
              </div>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  )
}
