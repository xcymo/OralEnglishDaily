import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  Database,
  FileJson,
  Info,
  Mic,
  RotateCcw,
  ShieldAlert,
  Trash2,
  Volume2,
} from 'lucide-react'
import type {
  LoadKey,
  PersistenceStatus,
  RecordingStats,
  ThemeMode,
} from '@/types'
import { content } from '@/content'
import {
  CONTENT_VERSION,
  DAILY_LOADS,
  REVIEW_INTERVALS,
} from '@/content/curriculum'
import { storageSizeKB } from '@/lib/storage'
import { formatBytes } from '@/lib/format'
import {
  clearRecordings,
  ensurePersistentStorage,
  recordingStats,
} from '@/lib/recordings'
import { cn } from '@/lib/cn'
import { useProgress } from '@/store/progress'
import { useToast } from '@/store/toast'
import { Card, SectionTitle } from '@/components/Card'
import { Segmented, Chip } from '@/components/Chip'
import { Button } from '@/components/Button'
import { Sheet } from '@/components/Sheet'
import { SpeakButton } from '@/components/SpeakButton'

type ConfirmAction = 'reset' | 'clear' | 'recordings'

export default function SettingsPage() {
  const {
    progress,
    updateSettings,
    resetProgress,
    clearAllData,
    storageWarning,
  } = useProgress()
  const toast = useToast()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [showIssues, setShowIssues] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [recordingInfo, setRecordingInfo] = useState<RecordingStats | null>(null)
  const [recordingReadFailed, setRecordingReadFailed] = useState(false)
  const [persistence, setPersistence] = useState<PersistenceStatus | null>(null)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const info = await recordingStats()
        if (!cancelled) {
          setRecordingInfo(info)
          setRecordingReadFailed(false)
        }
      } catch {
        if (!cancelled) setRecordingReadFailed(true)
      }
      const status = await ensurePersistentStorage()
      if (!cancelled) setPersistence(status)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleConfirm = async () => {
    const action = confirmAction
    if (!action || working) return
    setWorking(true)
    try {
      if (action === 'recordings') {
        await clearRecordings()
        toast.success('本机录音已清除')
      } else if (action === 'reset') {
        await resetProgress()
      } else {
        await clearAllData()
      }
      try {
        setRecordingInfo(await recordingStats())
        setRecordingReadFailed(false)
      } catch {
        setRecordingInfo({ count: 0, bytes: 0, latestAt: null })
      }
      setConfirmAction(null)
    } catch {
      toast.error('操作失败，请稍后重试')
    } finally {
      setWorking(false)
    }
  }

  const errors = useMemo(
    () => content.issues.filter((issue) => issue.level === 'error'),
    [],
  )
  const warnings = useMemo(
    () => content.issues.filter((issue) => issue.level === 'warning'),
    [],
  )
  const stats = useMemo(
    () => ({
      scenes: content.scenes.length,
      patterns: content.patterns.length,
      chunks: Object.keys(content.chunkMap).length,
    }),
    [],
  )

  const load = progress.settings.load
  const loadConfig = DAILY_LOADS[load]

  const changeLoad = (next: LoadKey) => {
    if (next === load) return
    updateSettings({ load: next })
    toast.show('学习量已调整，今天的计划保持不变，明天起生效')
  }

  const changeTheme = (next: ThemeMode) => {
    updateSettings({ theme: next })
  }

  return (
    <div className="px-4 pb-8 pt-safe">
      <div className="pt-3">
        <h1 className="text-[27px] font-extrabold leading-tight tracking-tight">
          设置
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          调整节奏和外观。所有数据都留在本机。
        </p>
      </div>

      {storageWarning && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/10 p-3 text-[12.5px] leading-relaxed text-warning">
          <ShieldAlert size={16} className="mt-0.5 shrink-0" />
          本地存储写入失败，进度可能无法保存。请检查浏览器隐私设置或剩余空间。
        </div>
      )}

      <section className="mt-4">
        <SectionTitle>每日学习量</SectionTitle>
        <Segmented
          ariaLabel="每日学习量"
          value={load}
          onChange={changeLoad}
          options={(Object.keys(DAILY_LOADS) as LoadKey[]).map((key) => ({
            value: key,
            label: DAILY_LOADS[key].label,
            hint: DAILY_LOADS[key].estimate,
          }))}
        />
        <Card className="mt-2.5 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-semibold">{loadConfig.hint}</p>
            <Chip static tone="brand">
              {loadConfig.estimate}
            </Chip>
          </div>
          <p className="mt-1 text-2xs leading-relaxed text-muted">
            每天约 {loadConfig.chunkLimit} 个新语块 · {loadConfig.patternCount} 个新句式 ·{' '}
            {loadConfig.reviewCount} 个复习。今天的计划已固定，调整从明天开始生效。
          </p>
        </Card>
      </section>

      <section className="mt-5">
        <SectionTitle>外观</SectionTitle>
        <Segmented
          ariaLabel="深色模式"
          value={progress.settings.theme}
          onChange={changeTheme}
          options={[
            { value: 'system', label: '跟随系统' },
            { value: 'light', label: '浅色' },
            { value: 'dark', label: '深色' },
          ]}
        />
      </section>

      <section className="mt-5">
        <SectionTitle
          action={
            <span className="text-2xs tabular-nums text-muted">
              {progress.settings.speechRate.toFixed(2)}×
            </span>
          }
        >
          示范语速
        </SectionTitle>
        <Card className="p-4">
          <div className="flex items-center gap-2.5">
            <Volume2 size={17} className="shrink-0 text-brand" />
            <input
              type="range"
              min={0.6}
              max={1.2}
              step={0.05}
              value={progress.settings.speechRate}
              onChange={(event) =>
                updateSettings({ speechRate: Number(event.target.value) })
              }
              aria-label="示范语速"
              className="flex-1"
            />
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-2xs text-muted">慢一点</span>
            <SpeakButton
              text="Could I get a large iced americano, please?"
              variant="pill"
              label="试听"
            />
            <span className="text-2xs text-muted">正常</span>
          </div>
        </Card>
      </section>

      <section className="mt-5">
        <SectionTitle>数据</SectionTitle>
        <Card className="divide-y divide-line">
          <div className="flex items-center gap-3 p-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Database size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold">学习进度</p>
              <p className="text-2xs text-muted">
                localStorage · {storageSizeKB()} KB · 只在这台设备
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmAction('recordings')}
            disabled={!recordingInfo || recordingInfo.count === 0}
            className="flex min-h-[54px] w-full items-center gap-3 p-3.5 text-left press hover:bg-surface-2/50 disabled:pointer-events-none disabled:opacity-55"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-2/10 text-brand-2">
              <Mic size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold">练习录音</p>
              <p className="text-2xs text-muted">
                {recordingReadFailed
                  ? '当前浏览器无法使用本机录音存储'
                  : recordingInfo
                    ? `${recordingInfo.count} 条 · ${formatBytes(recordingInfo.bytes)} · ${
                        persistence === 'granted'
                          ? '已申请持久存储'
                          : '本机 IndexedDB'
                      }`
                    : '正在读取…'}
              </p>
            </div>
            {recordingInfo && recordingInfo.count > 0 ? (
              <span className="flex shrink-0 items-center gap-1 text-2xs font-medium text-muted">
                <Trash2 size={13} />
                清除
              </span>
            ) : (
              <span className="shrink-0 text-2xs text-muted">暂无</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setConfirmAction('reset')}
            className="flex min-h-[54px] w-full items-center gap-3 p-3.5 text-left press hover:bg-surface-2/50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-muted">
              <RotateCcw size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold">重置学习进度</p>
              <p className="text-2xs text-muted">保留设置，清空任务记录与本机录音</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setConfirmAction('clear')}
            className="flex min-h-[54px] w-full items-center gap-3 p-3.5 text-left press hover:bg-surface-2/50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger/10 text-danger">
              <Trash2 size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-danger">清除全部本地数据</p>
              <p className="text-2xs text-muted">进度、录音、设置全部删除，无法恢复</p>
            </div>
          </button>
        </Card>
        <p className="mt-2 rounded-xl bg-surface-2/70 px-3 py-2.5 text-2xs leading-relaxed text-muted">
          录音存在浏览器 IndexedDB，不会上传。
          {persistence === 'granted'
            ? ' 浏览器已允许长期保留，但仍不建议清除站点数据。'
            : ' 清除浏览器站点数据会同时删除录音。'}
        </p>
      </section>

      <section className="mt-5">
        <SectionTitle>内容</SectionTitle>
        <Card className="p-4">
          <div className="flex items-start gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <FileJson size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold">
                内容版本 {CONTENT_VERSION}
              </p>
              <p className="text-2xs text-muted">
                {stats.scenes} 个场景 · {stats.patterns} 个句式 · {stats.chunks} 个语块
              </p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-md px-1.5 py-0.5 text-2xs font-semibold',
                errors.length > 0
                  ? 'bg-danger/10 text-danger'
                  : warnings.length > 0
                    ? 'bg-warning/10 text-warning'
                    : 'bg-success/10 text-success',
              )}
            >
              {errors.length > 0
                ? `${errors.length} 个错误`
                : warnings.length > 0
                  ? `${warnings.length} 条提醒`
                  : '校验通过'}
            </span>
          </div>

          {content.issues.length > 0 && (
            <div className="mt-3 border-t border-line pt-2.5">
              <button
                type="button"
                onClick={() => setShowIssues((value) => !value)}
                className="flex min-h-[44px] w-full items-center justify-between gap-2 text-left"
              >
                <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted">
                  <AlertTriangle size={14} />
                  查看校验详情
                </span>
                <ChevronDown
                  size={15}
                  className={cn('text-muted transition-transform', showIssues && 'rotate-180')}
                />
              </button>
              {showIssues && (
                <div className="space-y-1.5 pb-1">
                  {content.issues.slice(0, 12).map((issue, index) => (
                    <div
                      key={`${issue.file}-${issue.path}-${index}`}
                      className="rounded-lg bg-surface-2 p-2 text-2xs leading-relaxed"
                    >
                      <p
                        className={cn(
                          'font-mono font-medium',
                          issue.level === 'error' ? 'text-danger' : 'text-warning',
                        )}
                      >
                        {issue.file} → {issue.path || '(根)'}
                      </p>
                      <p className="mt-0.5 text-muted">{issue.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => setShowGuide(true)}
            icon={<BookOpen size={15} />}
          >
            如何新增内容
          </Button>
        </Card>
      </section>

      <div className="mt-6 flex items-start gap-2 text-2xs leading-relaxed text-muted/80">
        <Info size={14} className="mt-0.5 shrink-0" />
        <p>
          这是一个纯前端应用：没有账号、没有服务器。学习进度存在 localStorage，
          录音存在本机 IndexedDB，都不会上传；只有清除浏览器站点数据才会消失。
          语音识别和示范朗读来自浏览器，不支持时练习流程照常。
        </p>
      </div>

      <p className="mt-5 text-center text-2xs text-muted/60">
        口语日常 · Say It Daily · 本地版 v1.1.0
      </p>

      <Sheet
        open={confirmAction !== null}
        onClose={() => {
          if (!working) setConfirmAction(null)
        }}
        title={
          confirmAction === 'clear'
            ? '清除全部本地数据？'
            : confirmAction === 'recordings'
              ? '清除全部录音？'
              : '重置学习进度？'
        }
        description={
          confirmAction === 'clear'
            ? '这会删除所有进度、复习安排、卡壳记录、本机录音和设置，无法恢复。'
            : confirmAction === 'recordings'
              ? '会删除本机保存的全部练习录音。学习进度和设置不受影响。'
              : '会清空完成任务、学过的语块与句式、卡壳记录、复习队列，以及本机保存的录音。设置会保留。'
        }
        footer={
          <>
            <Button
              variant="secondary"
              fullWidth
              disabled={working}
              onClick={() => setConfirmAction(null)}
            >
              取消
            </Button>
            <Button
              variant="danger"
              fullWidth
              disabled={working}
              onClick={() => void handleConfirm()}
            >
              {working
                ? '处理中…'
                : confirmAction === 'reset'
                  ? '确认重置'
                  : '全部删除'}
            </Button>
          </>
        }
      >
        {confirmAction === 'recordings' ? (
          <div className="rounded-xl bg-surface-2 p-3 text-[12.5px] leading-relaxed text-muted">
            当前共 {recordingInfo?.count ?? 0} 条录音，占用{' '}
            {formatBytes(recordingInfo?.bytes ?? 0)}。删除后无法恢复。
          </div>
        ) : (
          <div className="rounded-xl bg-surface-2 p-3 text-[12.5px] leading-relaxed text-muted">
            当前进度：连续 {progress.streak} 天 · 完成{' '}
            {progress.completedTaskIds.length} 项 · 复习队列{' '}
            {progress.reviewQueue.length} 项 · 本机录音{' '}
            {recordingInfo?.count ?? 0} 条。复习间隔为{' '}
            {REVIEW_INTERVALS.join(' / ')} 天。
          </div>
        )}
      </Sheet>

      <Sheet
        open={showGuide}
        onClose={() => setShowGuide(false)}
        title="如何新增内容"
        description="所有内容都通过 JSON 自动加载，不需要改任何一个 React 组件。"
      >
        <div className="space-y-3">
          {[
            {
              title: '新增一个场景',
              body: '在 src/content/scenes/ 新建 your-scene.json，照 asking-repetition.json 的结构填写。保存后会自动出现在场景库和课程里；想调整教学顺序，把 id 加到 curriculum.ts 的 SCENE_ORDER。',
            },
            {
              title: '新增一个句式',
              body: '在 src/content/patterns/ 的任意 JSON 数组里追加一项。用 [方括号] 标出可替换部分；在场景 JSON 的 targetPatterns 里写句式 id 就能引用。',
            },
            {
              title: '调整每日任务规则',
              body: '打开 src/content/curriculum.ts：DAILY_LOADS 控制轻/标准/加强的新语块数、句式数与复习数；REVIEW_INTERVALS 控制 1/3/7/14/30 天复习间隔。',
            },
            {
              title: '内容校验',
              body: '字段写错时，开发环境控制台会打印「哪个文件、哪个字段、哪里不对」，本页也会显示校验结果。错误内容会被跳过，不会让整个应用白屏。',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-line p-3">
              <p className="text-[13px] font-semibold">{item.title}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                {item.body}
              </p>
            </div>
          ))}
          <p className="text-2xs leading-relaxed text-muted">
            更完整的说明见项目根目录 README.md。
          </p>
        </div>
      </Sheet>
    </div>
  )
}
