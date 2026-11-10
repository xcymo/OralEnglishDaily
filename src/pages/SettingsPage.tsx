import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Database,
  Eye,
  EyeOff,
  FileJson,
  Info,
  Loader2,
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
import {
  DEFAULT_MIMO_BASE_URL,
  MIMO_VOICES,
  normalizeMimoBaseUrl,
  previewMimoTts,
} from '@/lib/tts'
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
  const [apiKeyDraft, setApiKeyDraft] = useState(progress.settings.mimoApiKey)
  const [baseUrlDraft, setBaseUrlDraft] = useState(progress.settings.mimoBaseUrl)
  const [showApiKey, setShowApiKey] = useState(false)
  const [testingVoice, setTestingVoice] = useState(false)
  const [testError, setTestError] = useState('')
  const [testOk, setTestOk] = useState(false)

  useEffect(() => {
    setApiKeyDraft(progress.settings.mimoApiKey)
  }, [progress.settings.mimoApiKey])

  useEffect(() => {
    setBaseUrlDraft(progress.settings.mimoBaseUrl)
  }, [progress.settings.mimoBaseUrl])

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
    toast.show('学习量已调整；今天还没开始会自动重排，已经开始则明天生效')
  }

  const changeTheme = (next: ThemeMode) => {
    updateSettings({ theme: next })
  }

  const ttsProvider = progress.settings.ttsProvider
  const savedKey = progress.settings.mimoApiKey
  const maskKey = (key: string) =>
    key.length <= 8 ? '••••••' : `${key.slice(0, 4)}••••${key.slice(-4)}`

  const saveTtsSettings = () => {
    const key = apiKeyDraft.trim()
    const url = normalizeMimoBaseUrl(baseUrlDraft)
    updateSettings({ mimoApiKey: key, mimoBaseUrl: url })
    setApiKeyDraft(key)
    setBaseUrlDraft(url)
    setTestError('')
    setTestOk(false)
    toast.success(key ? 'MiMo 设置已保存到本机' : '已清除 MiMo API Key')
  }

  const testMimoVoice = async () => {
    const key = apiKeyDraft.trim()
    if (!key) {
      toast.error('先填写 MiMo API Key')
      return
    }
    if (testingVoice) return
    const url = normalizeMimoBaseUrl(baseUrlDraft)
    updateSettings({ mimoApiKey: key, mimoBaseUrl: url })
    setBaseUrlDraft(url)
    setTestError('')
    setTestOk(false)
    setTestingVoice(true)
    try {
      await previewMimoTts(
        'Could I get a large iced americano, please?',
        key,
        progress.settings.mimoVoice,
        () => setTestingVoice(false),
        url,
      )
      setTestOk(true)
    } catch (error) {
      setTestingVoice(false)
      const message = error instanceof Error ? error.message : '试听失败'
      setTestError(message)
      toast.error(message)
    }
  }

  const clearMimoKey = () => {
    updateSettings({ mimoApiKey: '' })
    setApiKeyDraft('')
    setTestError('')
    setTestOk(false)
    toast.success('已清除 MiMo API Key')
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
            {loadConfig.reviewCount} 个复习。今天还没开始时，调整后会立即按新节奏重排；已经开始则从明天生效。
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
            ttsProvider === 'mimo' ? (
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-2xs font-semibold',
                  savedKey
                    ? 'bg-success/10 text-success'
                    : 'bg-warning/10 text-warning',
                )}
              >
                {savedKey ? '已配置 Key' : '未配置 Key'}
              </span>
            ) : undefined
          }
        >
          语音播放
        </SectionTitle>
        <Segmented
          ariaLabel="语音播放方式"
          value={ttsProvider}
          onChange={(next) => {
            updateSettings({ ttsProvider: next })
            setTestError('')
            setTestOk(false)
          }}
          options={[
            { value: 'browser', label: '浏览器语音', hint: '系统自带' },
            { value: 'mimo', label: 'MiMo TTS', hint: '更自然' },
          ]}
        />

        {ttsProvider === 'browser' ? (
          <Card className="mt-2.5 p-3.5">
            <p className="text-[13px] leading-relaxed text-muted">
              使用浏览器自带的 speechSynthesis，无需配置。部分手机浏览器没有英文语音，或系统限制自动播放；遇到这种情况可以切到 MiMo TTS。
            </p>
          </Card>
        ) : (
          <Card className="mt-2.5 p-3.5">
            <div className="flex items-start gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Volume2 size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold">MiMo 2.5 TTS</p>
                <p className="text-2xs leading-relaxed text-muted">
                  用小米 MiMo 的 mimo-v2.5-tts 生成更自然的英文语音。Key 只保存在本机，浏览器直接请求 MiMo。
                </p>
              </div>
            </div>

            {!savedKey && (
              <p className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-warning/10 px-2.5 py-2 text-2xs leading-relaxed text-warning">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                还没有保存 API Key，播放时会自动回退到浏览器语音。
              </p>
            )}

            <label className="mt-3 block">
              <span className="text-[12px] font-medium text-muted">MiMo API Key</span>
              <div className="relative mt-1.5">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyDraft}
                  onChange={(event) => {
                    setApiKeyDraft(event.target.value)
                    setTestError('')
                    setTestOk(false)
                  }}
                  placeholder="粘贴 API Key"
                  autoComplete="off"
                  spellCheck={false}
                  className="h-12 w-full rounded-xl border border-line bg-surface pl-3 pr-12 text-[16px] outline-none transition-colors placeholder:text-[13px] placeholder:text-muted/60 focus:border-brand/50"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((value) => !value)}
                  aria-label={showApiKey ? '隐藏 API Key' : '显示 API Key'}
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface-2"
                >
                  {showApiKey ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-2xs text-muted">
                {savedKey ? `已保存：${maskKey(savedKey)}` : '未保存 Key'}
              </p>
              {savedKey && (
                <button
                  type="button"
                  onClick={clearMimoKey}
                  className="min-h-[44px] text-2xs font-medium text-danger"
                >
                  清除 Key
                </button>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={saveTtsSettings}>
                保存
              </Button>
              <Button
                size="sm"
                variant="soft"
                onClick={() => void testMimoVoice()}
                disabled={testingVoice}
                icon={
                  testingVoice ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Volume2 size={15} />
                  )
                }
              >
                {testingVoice ? '生成中…' : '保存并试听'}
              </Button>
              <a
                href="https://mimo.mi.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] items-center text-2xs font-medium text-brand underline decoration-brand/30 underline-offset-4"
              >
                申请 API Key
              </a>
            </div>

            {testError && (
              <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-danger/10 px-2.5 py-2 text-2xs leading-relaxed text-danger">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                {testError}
              </div>
            )}
            {testOk && !testError && (
              <p className="mt-2.5 flex items-center gap-1.5 text-2xs text-success">
                <CheckCircle2 size={13} />
                连接成功，试听语音已生成
              </p>
            )}

            <div className="mt-3 border-t border-line pt-3">
              <p className="text-[12px] font-medium text-muted">音色</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {MIMO_VOICES.map((voice) => (
                  <Chip
                    key={voice.id}
                    active={progress.settings.mimoVoice === voice.id}
                    onClick={() => updateSettings({ mimoVoice: voice.id })}
                    title={voice.hint}
                    className="px-2.5 text-2xs"
                  >
                    {voice.label}
                  </Chip>
                ))}
              </div>
              <p className="mt-1 text-2xs text-muted">
                英文推荐 Chloe / Mia（女声）或 Milo / Dean（男声）。
              </p>
            </div>

            <details className="mt-3 rounded-xl border border-line p-3">
              <summary className="flex min-h-[44px] cursor-pointer items-center text-[12.5px] font-medium text-muted">
                高级：自定义 API 地址
              </summary>
              <input
                value={baseUrlDraft}
                onChange={(event) => setBaseUrlDraft(event.target.value)}
                onBlur={() => {
                  const url = normalizeMimoBaseUrl(baseUrlDraft)
                  setBaseUrlDraft(url)
                  updateSettings({ mimoBaseUrl: url })
                }}
                placeholder={DEFAULT_MIMO_BASE_URL}
                autoComplete="off"
                spellCheck={false}
                className="mt-2 h-12 w-full rounded-xl border border-line bg-surface px-3 text-[16px] outline-none focus:border-brand/50"
              />
              <p className="mt-1 text-2xs leading-relaxed text-muted">
                默认 {DEFAULT_MIMO_BASE_URL}。Token Plan 国内节点可改成
                https://token-plan-cn.xiaomimimo.com/v1；也可以指向你自己的代理。
              </p>
            </details>

            <div className="mt-3 flex items-start gap-1.5 rounded-xl bg-surface-2 p-2.5 text-2xs leading-relaxed text-muted">
              <ShieldAlert size={13} className="mt-0.5 shrink-0" />
              <span>
                Key 会以明文保存在本机 localStorage，并由浏览器直接发送给 MiMo。不要在共用设备上保存长期有效的 Key；多人共用同一页面时，建议改成服务端代理。
              </span>
            </div>
          </Card>
        )}
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
              min={0.8}
              max={2.0}
              step={0.05}
              value={progress.settings.speechRate}
              onChange={(event) =>
                updateSettings({ speechRate: Number(event.target.value) })
              }
              aria-label="示范语速"
              className="flex-1"
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-2xs text-muted">
            <span>0.8 慢</span>
            <span>2.0 快</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => updateSettings({ speechRate: 1 })}
              className="inline-flex min-h-[44px] items-center text-2xs font-medium text-brand"
            >
              恢复 1.0
            </button>
            <SpeakButton
              text="Could I get a large iced americano, please?"
              variant="pill"
              label="试听"
            />
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
          录音存在本机 IndexedDB；示范朗读可用浏览器语音或 MiMo TTS（API Key 只在本机，
          播放时直接发送给 MiMo）。只有清除浏览器站点数据才会消失。
        </p>
      </div>

      <p className="mt-5 text-center text-2xs text-muted/60">
        口语日常 · Say It Daily · 本地版 v1.2.0
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
