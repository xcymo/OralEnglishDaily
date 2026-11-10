import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import type { DailyTask, PracticeStep, SelfRating, StuckNote } from '@/types'
import { getPattern, getScene } from '@/content'
import { cn } from '@/lib/cn'
import {
  buildExtraPatternTask,
  buildExtraSceneTask,
} from '@/lib/planner'
import { buildSteps, stepLabel } from '@/lib/practice'
import { diffDays } from '@/lib/date'
import { useProgress } from '@/store/progress'
import { useToast } from '@/store/toast'
import { RecordingSessionProvider } from '@/store/recordingContext'
import type { RecordingSessionMeta } from '@/types'
import { Button } from '@/components/Button'
import { Celebration } from '@/components/Celebration'
import { EmptyState } from '@/components/Skeleton'
import {
  ChunkStepView,
  IntroStepView,
  PatternStepView,
  RateStepView,
  RecallStepView,
  RoleplayStepView,
  ShadowStepView,
  SubstituteStepView,
} from '@/components/PracticeSteps'

function findTask(
  taskId: string,
  plan: ReturnType<typeof useProgress>['plan'],
  progress: ReturnType<typeof useProgress>['progress'],
): DailyTask | undefined {
  const inToday = plan.tasks.find((task) => task.id === taskId)
  if (inToday) return inToday
  for (const planEntry of Object.values(progress.plans)) {
    const found = planEntry.tasks.find((task) => task.id === taskId)
    if (found) return found
  }
  return undefined
}

export default function PracticePage() {
  const { taskId, sceneId, patternId } = useParams()
  const navigate = useNavigate()
  const {
    progress,
    plan,
    today,
    completeTask,
    saveSession,
    addStuckNote,
  } = useProgress()
  const toast = useToast()

  const [task] = useState<DailyTask | undefined>(() => {
    if (taskId) return findTask(taskId, plan, progress)
    if (sceneId) {
      const scene = getScene(sceneId)
      if (!scene) return undefined
      return {
        ...buildExtraSceneTask(scene, progress, today, 10),
        id: `extra-scene-${scene.id}-${today}`,
      }
    }
    if (patternId) {
      const pattern = getPattern(patternId)
      if (!pattern) return undefined
      return {
        ...buildExtraPatternTask(pattern, today),
        id: `extra-pattern-${pattern.id}-${today}`,
      }
    }
    return undefined
  })

  const steps = useMemo<PracticeStep[]>(
    () => (task ? buildSteps(task) : []),
    [task],
  )

  const savedSession = task ? progress.sessions[task.id] : undefined
  const [stepIndex, setStepIndex] = useState(() => {
    const saved = savedSession?.stepIndex ?? 0
    return Math.max(0, Math.min(steps.length - 1, saved))
  })
  const [drafts, setDrafts] = useState<Record<string, string>>(
    savedSession?.drafts ?? {},
  )
  const [fluency, setFluency] = useState(3)
  const [pronunciation, setPronunciation] = useState(3)
  const [stuck, setStuck] = useState<boolean | null>(null)
  const [note, setNote] = useState('')
  const [celebrating, setCelebrating] = useState(false)
  const submittedRef = useRef(false)
  const resumedRef = useRef(false)

  const exitPath = taskId
    ? '/'
    : sceneId
      ? `/scenes/${sceneId}`
      : patternId
        ? `/patterns/${patternId}`
        : '/'

  useEffect(() => {
    if (!task || resumedRef.current) return
    resumedRef.current = true
    if ((progress.sessions[task.id]?.stepIndex ?? 0) > 0) {
      toast.show('已回到上次练到的步骤')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id])

  /* 每一步都记住位置，刷新或返回都不丢 */
  useEffect(() => {
    if (!task) return
    saveSession(task.id, stepIndex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, task?.id])

  const step = steps[stepIndex]
  const isLastStep = stepIndex === steps.length - 1
  const rateIncomplete = stuck === null

  if (!task || !step) {
    return (
      <div className="flex min-h-dvh flex-col justify-center px-4">
        <EmptyState
          icon={<X size={22} />}
          title="这个练习找不到了"
          description="可能是内容更新了，或者链接过期。回到今天看看新任务。"
          action={<Button onClick={() => navigate('/')}>回到今天</Button>}
        />
      </div>
    )
  }

  const recordingMeta: RecordingSessionMeta = {
    taskId: task.id,
    taskTitle: task.title,
    taskType: task.type,
    date: task.date,
    stepIndex,
    stepKind: step.kind,
    sceneId: task.sceneId,
    patternId:
      step.kind === 'substitute' || step.kind === 'pattern'
        ? step.patternId
        : undefined,
  }

  const exit = () => {
    saveSession(task.id, stepIndex, drafts)
    navigate(exitPath)
  }
  const goNext = () => {
    saveSession(task.id, stepIndex, drafts)
    if (!isLastStep) {
      setStepIndex((index) => Math.min(steps.length - 1, index + 1))
    }
  }

  const goPrev = () => {
    saveSession(task.id, stepIndex, drafts)
    if (stepIndex > 0) setStepIndex((index) => index - 1)
    else exit()
  }

  const onStuck = (payload: Omit<StuckNote, 'id' | 'date'>) => {
    addStuckNote(payload)
  }

  const ratePatch = (patch: {
    fluency?: number
    pronunciation?: number
    stuck?: boolean | null
    note?: string
  }) => {
    if (patch.fluency !== undefined) setFluency(patch.fluency)
    if (patch.pronunciation !== undefined) setPronunciation(patch.pronunciation)
    if (patch.stuck !== undefined) setStuck(patch.stuck)
    if (patch.note !== undefined) setNote(patch.note)
  }

  const submit = () => {
    if (stuck === null) {
      toast.show('先选一下这次是否卡壳')
      return
    }
    if (submittedRef.current) return
    submittedRef.current = true
    const rating: SelfRating = {
      fluency,
      pronunciation,
      stuck,
      note: note.trim() || undefined,
    }
    completeTask(task, rating)
    setCelebrating(true)
  }

  const primaryAction = () => {
    if (step.kind === 'rate') submit()
    else if (isLastStep) exit()
    else goNext()
  }

  const primaryLabel =
    step.kind === 'intro'
      ? '开始练习'
      : step.kind === 'rate'
        ? '完成练习'
        : '下一步'

  const nextPending = plan.tasks.find(
    (entry) => entry.status === 'pending' && entry.id !== task.id,
  )
  const doneToday =
    plan.tasks.filter((entry) => entry.status === 'done').length +
    (plan.tasks.some((entry) => entry.id === task.id && entry.status !== 'done')
      ? 1
      : 0)
  const streakAfter =
    progress.lastActiveDate === task.date
      ? progress.streak
      : progress.lastActiveDate && diffDays(progress.lastActiveDate, task.date) === 1
        ? progress.streak + 1
        : 1

  const renderStep = () => {
    const common = {
      task,
      step,
      draft: drafts[String(stepIndex)] ?? '',
      setDraft: (value: string) =>
        setDrafts((prev) => ({ ...prev, [String(stepIndex)]: value })),
      onStuck,
    }
    switch (step.kind) {
      case 'intro':
        return <IntroStepView {...common} />
      case 'chunk':
        return <ChunkStepView {...common} />
      case 'shadow':
        return <ShadowStepView {...common} />
      case 'pattern':
        return <PatternStepView {...common} />
      case 'substitute':
        return <SubstituteStepView {...common} />
      case 'recall':
        return <RecallStepView {...common} />
      case 'roleplay':
        return <RoleplayStepView {...common} />
      case 'rate':
        return (
          <RateStepView
            task={task}
            fluency={fluency}
            pronunciation={pronunciation}
            stuck={stuck}
            note={note}
            onChange={ratePatch}
            onStuck={onStuck}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-30 bg-bg/90 pt-safe backdrop-blur-xl">
        <div className="flex min-h-[54px] items-center gap-2 px-3">
          <button
            type="button"
            onClick={exit}
            aria-label="退出练习，进度会保存"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted press hover:bg-surface-2"
          >
            <X size={21} />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-[11px] font-medium text-muted">
              {task.title}
            </p>
            <p className="text-[12.5px] font-semibold">
              {stepLabel(step, steps, stepIndex)}
            </p>
          </div>
          <button
            type="button"
            onClick={goPrev}
            disabled={stepIndex === 0}
            className="min-h-[44px] min-w-[44px] rounded-lg px-2 text-[12px] font-medium text-muted disabled:opacity-30"
          >
            上一步
          </button>
        </div>
        <div className="flex gap-1 px-4 pb-2.5" aria-hidden>
          {steps.map((_, index) => (
            <span
              key={index}
              className={cn(
                'h-1 flex-1 rounded-pill transition-colors duration-300',
                index <= stepIndex ? 'bg-brand' : 'bg-line',
              )}
            />
          ))}
        </div>
      </header>

      <div className="px-4 pb-action pt-2">
        <RecordingSessionProvider value={recordingMeta}>
          <div key={stepIndex} className="animate-fade-up">
            {renderStep()}
          </div>
        </RecordingSessionProvider>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center">
        <div className="w-full max-w-[520px] border-t border-line bg-bg/95 px-4 pb-safe-bottom-fixed pt-3 backdrop-blur-xl">
          {step.kind === 'rate' && rateIncomplete && (
            <p className="mb-2 text-center text-2xs text-warning">
              先选一下「这次卡壳了吗」
            </p>
          )}
          <Button
            fullWidth
            size="lg"
            onClick={primaryAction}
            disabled={step.kind === 'rate' && rateIncomplete}
            className="w-full"
          >
            {primaryLabel}
          </Button>
          <p className="mt-1.5 text-center text-2xs text-muted">
            {step.kind === 'intro'
              ? '所有步骤都可以跳过，先开口最重要'
              : '说不好也没关系，点下一步继续'}
          </p>
        </div>
      </div>

      <Celebration
        open={celebrating}
        title={task.title}
        minutes={task.estimatedMinutes}
        streak={streakAfter}
        doneToday={doneToday}
        totalToday={plan.tasks.length}
        hasNext={Boolean(nextPending)}
        onClose={() => {
          setCelebrating(false)
          navigate(exitPath)
        }}
        onNext={() => {
          setCelebrating(false)
          if (nextPending) navigate(`/practice/task/${nextPending.id}`)
          else navigate(exitPath)
        }}
      />
    </div>
  )
}
