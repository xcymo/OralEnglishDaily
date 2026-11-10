import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Database,
  Loader2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useRecorder } from '@/hooks/useRecorder'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { feedbackForScore, matchScore } from '@/lib/match'
import { formatDuration } from '@/lib/format'
import {
  describeRecordingError,
  getRecordingBlob,
  getRecordingMeta,
  saveRecording,
} from '@/lib/recordings'
import { useRecordingSession } from '@/store/recordingContext'
import type { RecordingMeta } from '@/types'
import { ProgressBar } from './ProgressRing'
import { Button } from './Button'

/**
 * 录音 + 回放 + 可选语音识别 + IndexedDB 持久化。
 * 权限失败、浏览器不支持、存储失败都只降级展示，不阻塞「下一步」。
 */
export function RecordWidget({
  expectedText,
  instruction = '跟读这句',
  className,
  compact = false,
}: {
  expectedText?: string
  instruction?: string
  className?: string
  compact?: boolean
}) {
  const persistRef = useRef<(blob: Blob, durationMs: number) => void>(() => {})
  const recorder = useRecorder((blob, durationMs) => {
    persistRef.current(blob, durationMs)
  })
  const recognition = useSpeechRecognition()
  const session = useRecordingSession()
  const recordingId = session ? `${session.taskId}::${session.stepIndex}` : null

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [savedMeta, setSavedMeta] = useState<RecordingMeta | null>(null)
  const [saving, setSaving] = useState(false)
  const [persistError, setPersistError] = useState<string | null>(null)
  const [loadingExisting, setLoadingExisting] = useState(Boolean(recordingId))
  const [loadedFromStorage, setLoadedFromStorage] = useState(false)

  const loadBlob = recorder.loadBlob

  /* 进入步骤时，把这一句上次的录音读回来 */
  useEffect(() => {
    if (!recordingId) return
    let cancelled = false
    setSavedMeta(null)
    setPersistError(null)
    setLoadedFromStorage(false)
    setLoadingExisting(true)
    void (async () => {
      try {
        const meta = await getRecordingMeta(recordingId)
        if (!meta || cancelled) return
        const blob = await getRecordingBlob(recordingId)
        if (!blob || cancelled) return
        loadBlob(blob, meta.durationMs)
        setSavedMeta(meta)
        setLoadedFromStorage(true)
      } catch {
        // 存储不可用：不影响本次练习
      } finally {
        if (!cancelled) setLoadingExisting(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [recordingId, loadBlob])

  const persist = useCallback(
    async (target: Blob, durationMs: number) => {
      if (!session || !recordingId) return
      setSaving(true)
      setPersistError(null)
      try {
        const meta = await saveRecording(
          {
            id: recordingId,
            taskId: session.taskId,
            taskTitle: session.taskTitle,
            taskType: session.taskType,
            date: session.date,
            stepIndex: session.stepIndex,
            stepKind: session.stepKind,
            text: expectedText ?? '',
            sceneId: session.sceneId,
            patternId: session.patternId,
          },
          target,
          durationMs,
        )
        setSavedMeta(meta)
        setLoadedFromStorage(false)
      } catch (error) {
        setPersistError(describeRecordingError(error))
      } finally {
        setSaving(false)
      }
    },
    [session, recordingId, expectedText],
  )

  /* 录音结束的瞬间就触发写入，不依赖组件是否还挂载 */
  useEffect(() => {
    persistRef.current = (blob, durationMs) => {
      void persist(blob, durationMs)
    }
  }, [persist])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      setPlaying(false)
    }
    recognition.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.url])

  useEffect(() => {
    return () => {
      try {
        recognition.stop()
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const score = useMemo(() => {
    if (!expectedText || !recognition.transcript) return null
    return matchScore(expectedText, recognition.transcript)
  }, [expectedText, recognition.transcript])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }
    try {
      audio.currentTime = 0
      await audio.play()
      setPlaying(true)
    } catch {
      setPlaying(false)
    }
  }

  const startRecording = () => {
    recognition.reset()
    setSavedMeta(null)
    setLoadedFromStorage(false)
    setPersistError(null)
    void recorder.start()
  }

  const unsupported = recorder.status === 'unsupported'
  const denied = recorder.status === 'denied'
  const readingExisting = loadingExisting && recorder.status === 'idle'

  return (
    <div
      className={cn(
        'rounded-2xl border border-line bg-surface-2/60 p-3.5',
        className,
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          录音 · 可选
        </p>
        <span className="inline-flex items-center gap-1 text-2xs text-muted">
          <Database size={11} />
          只在本机
        </span>
      </div>

      {unsupported && (
        <div className="flex items-start gap-2 text-[13px] leading-relaxed text-warning">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>
            当前浏览器不支持录音。可以直接开口练，点「下一步」继续，不影响流程。
          </span>
        </div>
      )}

      {denied && (
        <div className="space-y-2.5">
          <div className="flex items-start gap-2 text-[13px] leading-relaxed text-warning">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{recorder.error}</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={startRecording}>
              再试一次
            </Button>
            <span className="self-center text-2xs text-muted">也可以直接跳过</span>
          </div>
        </div>
      )}

      {readingExisting && (
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Loader2 size={21} className="animate-spin" />
          </span>
          <div>
            <p className="text-[14px] font-semibold">正在读取上次的录音…</p>
            <p className="text-2xs text-muted">只读本机 IndexedDB，很快</p>
          </div>
        </div>
      )}

      {!unsupported && !denied && !readingExisting && (
        <div className="flex items-center gap-3">
          {recorder.status === 'idle' && (
            <>
              <button
                type="button"
                onClick={startRecording}
                aria-label="开始录音"
                className={cn(
                  'press flex shrink-0 items-center justify-center rounded-full bg-brand text-on-brand shadow-[0_10px_24px_-12px_rgb(var(--brand)/0.85)]',
                  compact ? 'h-12 w-12' : 'h-14 w-14',
                )}
              >
                <Mic size={compact ? 20 : 23} />
              </button>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold">{instruction}</p>
                <p className="text-2xs leading-relaxed text-muted">
                  点麦克风开始，说完点方块停止
                </p>
              </div>
            </>
          )}

          {recorder.status === 'requesting' && (
            <>
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Loader2 size={22} className="animate-spin" />
              </span>
              <p className="text-[13.5px] text-muted">正在请求麦克风权限…</p>
            </>
          )}

          {recorder.status === 'recording' && (
            <>
              <button
                type="button"
                onClick={recorder.stop}
                aria-label="停止录音"
                className="press flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-danger text-on-brand"
              >
                <Square size={18} fill="currentColor" />
              </button>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-7 items-center gap-[3px]" aria-hidden>
                  {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                    <span
                      key={index}
                      className="w-[3px] origin-center animate-wave rounded-full bg-danger/70"
                      style={{
                        height: `${14 + (index % 3) * 7}px`,
                        animationDelay: `${index * 90}ms`,
                      }}
                    />
                  ))}
                </span>
                <span className="font-mono text-[15px] tabular-nums text-ink">
                  {recorder.formatted}
                </span>
                <span className="ml-auto text-2xs text-muted">正在录…</span>
              </div>
            </>
          )}

          {recorder.status === 'ready' && recorder.url && (
            <>
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? '暂停回放' : '回放录音'}
                className="press flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand"
              >
                {playing ? <Pause size={21} /> : <Play size={22} className="ml-0.5" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold">
                  已录 {recorder.formatted}
                </p>
                <p className="text-2xs leading-relaxed text-muted">
                  {loadedFromStorage
                    ? '上次录的 · 已保存在本机'
                    : '听一遍，注意节奏和重音'}
                </p>
              </div>
              <button
                type="button"
                onClick={startRecording}
                aria-label="重新录音"
                className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2"
              >
                <RotateCcw size={18} />
              </button>
              <audio
                ref={audioRef}
                src={recorder.url}
                onEnded={() => setPlaying(false)}
                playsInline
                className="hidden"
              />
            </>
          )}
        </div>
      )}

      {recorder.error && !denied && recorder.status !== 'unsupported' && (
        <p className="mt-2 text-2xs leading-relaxed text-warning">
          {recorder.error}
        </p>
      )}

      {session && recorder.status === 'ready' && (
        <div className="mt-2.5 flex items-center gap-1.5 text-2xs">
          {saving ? (
            <>
              <Loader2 size={11} className="animate-spin text-brand" />
              <span className="text-muted">正在保存到本机…</span>
            </>
          ) : savedMeta ? (
            <>
              <Database size={11} className="text-success" />
              <span className="text-success">
                已保存在本机 · {formatDuration(savedMeta.durationMs)}
              </span>
            </>
          ) : (
            <>
              <AlertCircle size={11} className="text-warning" />
              <span className="text-warning">本次录音尚未保存</span>
            </>
          )}
        </div>
      )}

      {persistError && (
        <div className="mt-2 flex items-start gap-2 rounded-xl bg-warning/10 p-2.5 text-2xs leading-relaxed text-warning">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p>{persistError}</p>
            <button
              type="button"
              onClick={() => {
                if (recorder.blob) {
                  void persist(recorder.blob, recorder.durationMs)
                }
              }}
              className="mt-0.5 inline-flex min-h-[44px] items-center font-semibold underline decoration-warning/40 underline-offset-4"
            >
              再试一次保存
            </button>
          </div>
        </div>
      )}

      {/* 可选语音识别：只对「这一次新录的」开放；恢复出来的旧录音不重复识别 */}
      {recorder.status === 'ready' && !loadedFromStorage && (
        <div className="mt-3 border-t border-line pt-3">
          {!recognition.supported ? (
            <p className="text-2xs leading-relaxed text-muted">
              当前浏览器不支持语音识别——录完自己听一遍就够，不影响练习。
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="soft"
                  onClick={() =>
                    recognition.listening ? recognition.stop() : recognition.start()
                  }
                  icon={<Sparkles size={15} />}
                >
                  {recognition.listening ? '停止识别' : '识别检查（可选）'}
                </Button>
                {recognition.listening && (
                  <span className="flex items-center gap-1.5 text-2xs text-brand">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                    正在听…
                  </span>
                )}
              </div>
              {recognition.error && (
                <p className="text-2xs text-warning">{recognition.error}</p>
              )}
              {recognition.transcript && (
                <div className="rounded-xl bg-surface px-3 py-2.5">
                  <p className="text-[13px] leading-relaxed text-ink">
                    「{recognition.transcript}」
                  </p>
                  {score !== null && (
                    <div className="mt-2">
                      <div className="mb-1 flex items-center justify-between text-2xs text-muted">
                        <span>识别匹配度（粗略参考）</span>
                        <span className="font-semibold text-ink">
                          {Math.round(score * 100)}%
                        </span>
                      </div>
                      <ProgressBar
                        value={score}
                        tone={score >= 0.7 ? 'success' : 'warning'}
                      />
                      <p className="mt-1.5 text-2xs text-muted">
                        {feedbackForScore(score)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
