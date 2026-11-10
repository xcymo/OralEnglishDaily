import { useState } from 'react'
import {
  Eye,
  EyeOff,
  Lightbulb,
  MessageSquareQuote,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import type { DailyTask, PracticeStep, StuckNote } from '@/types'
import { getChunk, getPattern, getScene } from '@/content'
import { cn } from '@/lib/cn'
import { fillPattern, maskPattern, taskIntro } from '@/lib/practice'
import { SpeakButton } from '@/components/SpeakButton'
import { RecordWidget } from '@/components/RecordWidget'
import { PatternText } from '@/components/PatternText'
import { TaskIcon } from '@/components/TaskBits'
import { Button } from '@/components/Button'
import { Chip } from '@/components/Chip'
import { RatingPicker, YesNoPicker } from '@/components/RatingPicker'

export interface StepViewProps {
  task: DailyTask
  step: PracticeStep
  draft: string
  setDraft: (value: string) => void
  onStuck: (note: Omit<StuckNote, 'id' | 'date'>) => void
}

function StepEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
      {children}
    </p>
  )
}

function StuckLink({
  onClick,
  label = '卡住了？加入「不会说清单」',
}: {
  onClick: () => void
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[44px] items-center gap-1.5 text-[12.5px] font-medium text-muted transition-colors hover:text-warning"
    >
      <TriangleAlert size={14} />
      {label}
    </button>
  )
}

function ExampleLine({ en, zh }: { en: string; zh: string }) {
  return (
    <div className="flex items-start gap-2">
      <SpeakButton text={en} label="播放例句" />
      <div className="min-w-0 pt-0.5">
        <p className="text-[13.5px] font-medium leading-snug">{en}</p>
        <p className="mt-0.5 text-[12px] text-muted">{zh}</p>
      </div>
    </div>
  )
}

/* ---------------- 介绍 ---------------- */

export function IntroStepView({ task }: StepViewProps) {
  const intro = taskIntro(task)
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <TaskIcon type={task.type} />
        <div>
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-muted">
            {task.tag === 'review' ? '复习' : task.tag === 'extra' ? '加练' : '新学'} ·{' '}
            {task.estimatedMinutes} 分钟
          </p>
          <p className="text-[13px] font-medium text-ink">{task.title}</p>
        </div>
      </div>

      <div>
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-balance">
          {intro.title}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{intro.subtitle}</p>
      </div>

      <div className="surface-card space-y-2.5 p-4">
        {intro.tips.map((tip, index) => (
          <div key={tip} className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand">
              {index + 1}
            </span>
            <p className="text-[13px] leading-relaxed text-muted">{tip}</p>
          </div>
        ))}
      </div>

      <p className="text-[12px] leading-relaxed text-muted">
        不用担心说错。每一步都可以跳过，录音只保存在本机。
      </p>
    </div>
  )
}

/* ---------------- 语块 ---------------- */

export function ChunkStepView({ task, step, onStuck }: StepViewProps) {
  const chunk = step.kind === 'chunk' ? getChunk(step.chunkId) : undefined
  const scene = getScene(task.sceneId)
  if (!chunk) {
    return <p className="text-[14px] text-muted">这条语块已更新，直接进入下一步。</p>
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <StepEyebrow>{scene?.titleZh ?? '新语块'}</StepEyebrow>
        <span className="text-2xs text-muted">听 → 跟读</span>
      </div>

      <div>
        <p className="text-[26px] font-bold leading-[1.3] tracking-tight">
          {chunk.en}
        </p>
        <p className="mt-2 text-[14.5px] text-muted">{chunk.zh}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SpeakButton text={chunk.en} variant="pill" label="听示范" />
        {chunk.tags.slice(0, 2).map((tag) => (
          <Chip key={tag} static>
            #{tag}
          </Chip>
        ))}
      </div>

      {chunk.note && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-surface p-3.5">
          <Lightbulb size={17} className="mt-0.5 shrink-0 text-warning" />
          <p className="text-[13px] leading-relaxed text-muted">{chunk.note}</p>
        </div>
      )}

      {chunk.exampleEn && (
        <div className="rounded-2xl bg-surface-2/70 p-3.5">
          <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.12em] text-muted">
            迷你对话
          </p>
          <ExampleLine en={chunk.exampleEn} zh={chunk.exampleZh} />
        </div>
      )}

      <RecordWidget expectedText={chunk.en} instruction="跟读这一句" />

      <StuckLink
        onClick={() =>
          onStuck({
            kind: 'chunk',
            refId: chunk.id,
            sceneId: task.sceneId,
            text: chunk.en,
            note: '练习时标记卡壳',
          })
        }
      />
    </div>
  )
}

/* ---------------- 跟读 ---------------- */

export function ShadowStepView({ task, step, onStuck }: StepViewProps) {
  const chunk = step.kind === 'shadow' ? getChunk(step.chunkId) : undefined
  const scene = getScene(task.sceneId)
  const [showZh, setShowZh] = useState(true)
  if (!chunk) {
    return <p className="text-[14px] text-muted">这条语块已更新，直接进入下一步。</p>
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <StepEyebrow>{scene?.titleZh ?? '跟读'}</StepEyebrow>
        <button
          type="button"
          onClick={() => setShowZh((v) => !v)}
          className="inline-flex min-h-[44px] items-center gap-1 text-2xs font-medium text-muted"
        >
          {showZh ? <EyeOff size={13} /> : <Eye size={13} />}
          {showZh ? '藏起中文' : '显示中文'}
        </button>
      </div>

      <div>
        <p className="text-[26px] font-bold leading-[1.3] tracking-tight">
          {chunk.en}
        </p>
        {showZh && <p className="mt-2 text-[14px] text-muted">{chunk.zh}</p>}
      </div>

      <div className="rounded-2xl bg-brand-soft/60 p-3.5">
        <p className="text-[13px] leading-relaxed text-brand">
          先点喇叭听一遍，注意重音和停顿；再自己读两遍，尽量对上节奏。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <SpeakButton text={chunk.en} variant="pill" label="听示范" />
        <SpeakButton text={chunk.en} variant="pill" label="再听一遍" />
      </div>

      <RecordWidget expectedText={chunk.en} instruction="跟着读这一句" />

      <StuckLink
        onClick={() =>
          onStuck({
            kind: 'chunk',
            refId: chunk.id,
            sceneId: task.sceneId,
            text: chunk.en,
            note: '跟读时总是卡住',
          })
        }
      />
    </div>
  )
}

/* ---------------- 句式 ---------------- */

export function PatternStepView({ step }: StepViewProps) {
  const pattern = step.kind === 'pattern' ? getPattern(step.patternId) : undefined
  if (!pattern) {
    return <p className="text-[14px] text-muted">这个句式已更新，直接进入下一步。</p>
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <StepEyebrow>可迁移句式</StepEyebrow>
        <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-2xs text-muted">
          {pattern.level}
        </span>
      </div>

      <div>
        <p className="text-[24px] font-bold leading-[1.35] tracking-tight">
          <PatternText text={pattern.patternEn} />
        </p>
        <p className="mt-2 text-[14px] text-muted">{pattern.patternZh}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SpeakButton
          text={pattern.patternEn.replace(/[\[\]]/g, '')}
          variant="pill"
          label="听示范"
        />
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-surface p-3.5">
        <MessageSquareQuote size={17} className="mt-0.5 shrink-0 text-brand" />
        <p className="text-[13px] leading-relaxed text-muted">{pattern.usageNote}</p>
      </div>

      <div className="rounded-2xl bg-surface-2/70 p-3.5">
        <p className="mb-2.5 text-2xs font-semibold uppercase tracking-[0.12em] text-muted">
          这样说
        </p>
        <div className="space-y-3">
          {pattern.examples.slice(0, 2).map((example) => (
            <ExampleLine key={example.en} en={example.en} zh={example.zh} />
          ))}
        </div>
      </div>

      {pattern.substitutions.length > 0 && (
        <div>
          <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.12em] text-muted">
            高亮部分可以换成
          </p>
          <div className="flex flex-wrap gap-1.5">
            {pattern.substitutions.map((sub) => (
              <span
                key={sub.en}
                className="rounded-lg border border-line bg-surface px-2 py-1 text-[12px] text-muted"
              >
                {sub.en}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------- 替换造句 ---------------- */

export function SubstituteStepView({ step, draft, setDraft, onStuck }: StepViewProps) {
  const pattern = step.kind === 'substitute' ? getPattern(step.patternId) : undefined
  const [revealed, setRevealed] = useState(false)
  if (!pattern) {
    return <p className="text-[14px] text-muted">这个句式已更新，直接进入下一步。</p>
  }
  const sub =
    pattern.substitutions[step.kind === 'substitute' ? step.substitutionIndex : 0]
  const filled = sub ? fillPattern(pattern.patternEn, sub.en) : pattern.patternEn

  return (
    <div className="space-y-4">
      <StepEyebrow>替换造句</StepEyebrow>

      <div className="rounded-2xl border border-line bg-surface p-3.5">
        <p className="text-[14px] font-semibold leading-snug">
          <PatternText text={pattern.patternEn} />
        </p>
        <p className="mt-1 text-[12px] text-muted">{pattern.patternZh}</p>
      </div>

      <div>
        <p className="text-[12px] font-medium text-muted">用这个句式，说说你的情况：</p>
        <p className="mt-1.5 text-[20px] font-bold leading-snug tracking-tight">
          {sub?.zh ?? '换一个内容，说一句。'}
        </p>
      </div>

      <div className="rounded-2xl bg-brand-soft/60 p-3.5">
        <p className="text-[12px] font-semibold text-brand">句式骨架</p>
        <p className="mt-1 text-[14px] leading-relaxed text-brand/90">
          {maskPattern(pattern.patternEn)}
        </p>
        {revealed ? (
          <p className="mt-2 border-t border-brand/15 pt-2 text-[13.5px] font-medium leading-relaxed text-ink">
            {filled.replace(/\[|\]/g, '')}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="mt-1.5 inline-flex min-h-[44px] items-center gap-1 text-[12.5px] font-semibold text-brand underline decoration-brand/30 underline-offset-4"
          >
            <Eye size={13} />
            看参考说法
          </button>
        )}
      </div>

      <RecordWidget expectedText={filled.replace(/\[|\]/g, '')} instruction="用自己的话说一句" />

      <label className="block">
        <span className="text-[12px] font-medium text-muted">写下来（可选）</span>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={2}
          placeholder="把你说出来的那句话写下来…"
          className="mt-1.5 w-full resize-none scroll-mb-40 scroll-mt-24 rounded-xl border border-line bg-surface px-3 py-2.5 text-[16px] leading-relaxed outline-none placeholder:text-muted/60 focus:border-brand/50"
        />
      </label>

      <StuckLink
        onClick={() =>
          onStuck({
            kind: 'pattern',
            refId: pattern.id,
            text: pattern.patternEn,
            note: sub ? `替换时卡住：${sub.zh}` : '替换造句卡住',
          })
        }
      />
    </div>
  )
}

/* ---------------- 回忆（复习） ---------------- */

export function RecallStepView({ task, step, onStuck }: StepViewProps) {
  const chunk = step.kind === 'recall' ? getChunk(step.chunkId) : undefined
  const scene = getScene(task.sceneId)
  const [revealed, setRevealed] = useState(false)
  if (!chunk) {
    return <p className="text-[14px] text-muted">这条语块已更新，直接进入下一步。</p>
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <StepEyebrow>{scene?.titleZh ?? '复习'}</StepEyebrow>
        <span className="text-2xs text-muted">先想，再看</span>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 text-center">
        <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-muted">
          这句话用英语怎么说？
        </p>
        <p className="mt-2 text-[20px] font-bold leading-snug tracking-tight">
          {chunk.zh}
        </p>
        {!revealed && (
          <Button
            variant="soft"
            className="mt-4"
            onClick={() => setRevealed(true)}
            icon={<Eye size={16} />}
          >
            想不起来，看答案
          </Button>
        )}
        {revealed && (
          <div className="mt-4 animate-fade-up">
            <p className="text-[20px] font-semibold leading-snug text-brand">
              {chunk.en}
            </p>
            <div className="mt-3 flex justify-center">
              <SpeakButton text={chunk.en} variant="pill" label="听示范" />
            </div>
          </div>
        )}
      </div>

      {revealed && chunk.note && (
        <p className="text-[12.5px] leading-relaxed text-muted">{chunk.note}</p>
      )}

      <RecordWidget expectedText={chunk.en} instruction="说出来，再核对" />

      <div className="flex flex-wrap items-center gap-3">
        <StuckLink
          onClick={() =>
            onStuck({
              kind: 'chunk',
              refId: chunk.id,
              sceneId: task.sceneId,
              text: chunk.en,
              note: '复习时没想起来',
            })
          }
          label="没想起来 · 加入清单"
        />
      </div>
    </div>
  )
}

/* ---------------- 角色扮演 ---------------- */

export function RoleplayStepView({ task, onStuck }: StepViewProps) {
  const scene = getScene(task.sceneId)
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  if (!scene) {
    return <p className="text-[14px] text-muted">这个场景已更新，直接进入下一步。</p>
  }
  const yourLines = scene.roleplay.script
    .filter((line) => line.speaker === 'you')
    .map((line) => line.en)
  return (
    <div className="space-y-4">
      <StepEyebrow>角色扮演</StepEyebrow>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-[14px] font-semibold leading-relaxed">
          {scene.roleplay.promptZh}
        </p>
        {scene.roleplay.goals.length > 0 && (
          <ul className="mt-2.5 space-y-1">
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
      </div>

      <div className="space-y-2">
        {scene.roleplay.script.map((line, index) => {
          const isYou = line.speaker === 'you'
          const open = revealed[index]
          return (
            <div
              key={`${line.en}-${index}`}
              className={cn(
                'rounded-2xl border p-3',
                isYou
                  ? 'border-brand/25 bg-brand-soft/40'
                  : 'border-line bg-surface',
              )}
            >
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    'mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-2xs font-semibold',
                    isYou ? 'bg-brand text-on-brand' : 'bg-surface-2 text-muted',
                  )}
                >
                  {isYou ? '你' : '对方'}
                </span>
                <div className="min-w-0 flex-1">
                  {isYou && !open ? (
                    <>
                      <p className="text-[13px] leading-relaxed text-muted">
                        {line.zh}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setRevealed((prev) => ({ ...prev, [index]: true }))
                        }
                        className="mt-1 inline-flex min-h-[44px] items-center gap-1 text-2xs font-semibold text-brand"
                      >
                        <Eye size={12} />
                        看英文示范
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-[13.5px] font-medium leading-snug">
                        {line.en}
                      </p>
                      <p className="mt-0.5 text-[12px] text-muted">{line.zh}</p>
                    </>
                  )}
                </div>
                <SpeakButton text={line.en} label="播放这句" />
              </div>
            </div>
          )
        })}
      </div>

      <RecordWidget
        expectedText={yourLines.join(' ')}
        instruction="完整演一遍你的部分"
      />

      <StuckLink
        onClick={() =>
          onStuck({
            kind: 'task',
            refId: scene.id,
            sceneId: scene.id,
            text: scene.titleZh,
            note: '角色扮演时卡住',
          })
        }
      />
    </div>
  )
}

/* ---------------- 自评 ---------------- */

export interface RateStepViewProps {
  task: DailyTask
  fluency: number
  pronunciation: number
  stuck: boolean | null
  note: string
  onChange: (patch: {
    fluency?: number
    pronunciation?: number
    stuck?: boolean | null
    note?: string
  }) => void
  onStuck: (note: Omit<StuckNote, 'id' | 'date'>) => void
}

export function RateStepView({
  task,
  fluency,
  pronunciation,
  stuck,
  note,
  onChange,
  onStuck,
}: RateStepViewProps) {
  return (
    <div className="space-y-5">
      <div>
        <StepEyebrow>最后一步 · 自评</StepEyebrow>
        <h1 className="mt-1 text-[24px] font-extrabold leading-tight tracking-tight">
          这次练得怎么样？
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          按真实感受选就好。低分会自动安排更早的复习。
        </p>
      </div>

      <div className="surface-card space-y-5 p-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13.5px] font-semibold">流利度</p>
            <span className="text-2xs text-muted">说得多顺</span>
          </div>
          <RatingPicker
            value={fluency}
            onChange={(value) => onChange({ fluency: value })}
            lowLabel="很卡"
            highLabel="很顺"
            ariaLabel="流利度"
            emojis={['😖', '😕', '😐', '🙂', '😄']}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13.5px] font-semibold">这次卡壳了吗</p>
            <span className="text-2xs text-muted">说不出来 / 中途停住</span>
          </div>
          <YesNoPicker
            value={stuck}
            onChange={(value) => onChange({ stuck: value })}
            yesLabel="有点卡"
            noLabel="还算顺"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13.5px] font-semibold">发音自评</p>
            <span className="text-2xs text-muted">自己听着像不像</span>
          </div>
          <RatingPicker
            value={pronunciation}
            onChange={(value) => onChange({ pronunciation: value })}
            lowLabel="不准"
            highLabel="自然"
            ariaLabel="发音"
          />
        </div>

        <label className="block border-t border-line pt-4">
          <span className="text-[12.5px] font-medium text-muted">
            哪里卡住了？（可选）
          </span>
          <textarea
            value={note}
            onChange={(event) => onChange({ note: event.target.value })}
            rows={2}
            placeholder="例如：想不起「打包」怎么说"
            className="mt-1.5 w-full resize-none scroll-mb-40 scroll-mt-24 rounded-xl border border-line bg-surface px-3 py-2.5 text-[16px] leading-relaxed outline-none placeholder:text-muted/60 focus:border-brand/50"
          />
        </label>
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl bg-surface-2/70 p-3.5">
        <Sparkles size={16} className="mt-0.5 shrink-0 text-brand" />
        <p className="text-[12.5px] leading-relaxed text-muted">
          本次：{task.title} · 约 {task.estimatedMinutes} 分钟。自评只保存在本机。
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          onStuck({
            kind: 'task',
            refId: task.patternIds?.[0] ?? task.sceneId ?? task.id,
            sceneId: task.sceneId,
            text: task.title,
            note: note.trim() || '自评时标记卡壳',
          })
        }
        className="inline-flex min-h-[44px] items-center gap-1.5 text-[12.5px] font-medium text-muted hover:text-warning"
      >
        <TriangleAlert size={14} />
        把这项加入「不会说清单」
      </button>
    </div>
  )
}
