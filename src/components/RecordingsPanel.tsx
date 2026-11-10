import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronRight,
  Database,
  Loader2,
  Mic,
  Pause,
  Play,
  Trash2,
} from 'lucide-react'
import type { RecordingMeta, StepKind } from '@/types'
import {
  deleteRecording,
  getRecordingBlob,
  listRecordings,
} from '@/lib/recordings'
import { formatBytes, formatDuration } from '@/lib/format'
import { formatTime, relativeDay } from '@/lib/date'
import { useToast } from '@/store/toast'
import { SectionTitle } from './Card'
import { EmptyState, Skeleton } from './Skeleton'
import { Sheet } from './Sheet'

const STEP_LABELS: Partial<Record<StepKind, string>> = {
  chunk: '语块跟读',
  shadow: '跟读',
  substitute: '替换造句',
  recall: '复习回忆',
  roleplay: '角色扮演',
  pattern: '句式朗读',
}

function RecordingPlayButton({ id }: { id: string }) {
  const toast = useToast()
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      audioRef.current = null
      urlRef.current = null
    }
  }, [])

  const toggle = async () => {
    if (state === 'playing') {
      audioRef.current?.pause()
      setState('idle')
      return
    }
    if (state === 'loading') return
    try {
      let audio = audioRef.current
      if (!audio) {
        setState('loading')
        const blob = await getRecordingBlob(id)
        if (!blob) {
          setState('idle')
          toast.error('这段录音已经不在了')
          return
        }
        const url = URL.createObjectURL(blob)
        urlRef.current = url
        audio = new Audio(url)
        audio.onended = () => setState('idle')
        audio.onerror = () => {
          setState('idle')
          toast.error('播放失败，请稍后重试')
        }
        audioRef.current = audio
      }
      await audio.play()
      setState('playing')
    } catch {
      setState('idle')
      toast.error('播放失败，请稍后重试')
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={state === 'playing' ? '暂停录音回放' : '播放录音'}
      className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand"
    >
      {state === 'loading' ? (
        <Loader2 size={17} className="animate-spin" />
      ) : state === 'playing' ? (
        <Pause size={17} />
      ) : (
        <Play size={17} className="ml-0.5" />
      )}
    </button>
  )
}

function RecordingRow({
  item,
  today,
  confirmId,
  deletingId,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  item: RecordingMeta
  today: string
  confirmId: string | null
  deletingId: string | null
  onAskDelete: (id: string) => void
  onCancelDelete: () => void
  onConfirmDelete: (id: string) => void
}) {
  const stepLabel = STEP_LABELS[item.stepKind]
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5">
      <RecordingPlayButton id={item.id} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{item.taskTitle}</p>
        <p className="truncate text-2xs text-muted">
          {[stepLabel, item.text].filter(Boolean).join(' · ')}
        </p>
        <p className="mt-0.5 text-2xs text-muted/70">
          {relativeDay(item.date, today)} {formatTime(item.createdAt)} ·{' '}
          {formatDuration(item.durationMs)}
        </p>
      </div>
      {confirmId === item.id ? (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onCancelDelete}
            className="min-h-[44px] min-w-[44px] rounded-lg px-2 text-2xs text-muted"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => onConfirmDelete(item.id)}
            disabled={deletingId === item.id}
            className="min-h-[44px] rounded-lg bg-danger/10 px-2.5 text-2xs font-semibold text-danger disabled:opacity-50"
          >
            {deletingId === item.id ? '删除中…' : '删除'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onAskDelete(item.id)}
          aria-label="删除这段录音"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-danger"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  )
}

/** 进度页的「我的录音」：全部来自 IndexedDB，按最近录制排序 */
export function RecordingsSection({ today }: { today: string }) {
  const toast = useToast()
  const [items, setItems] = useState<RecordingMeta[]>([])
  const [bytes, setBytes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const list = await listRecordings(200)
      setItems(list)
      setBytes(list.reduce((sum, item) => sum + item.size, 0))
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteRecording(id)
      const removed = items.find((item) => item.id === id)
      setItems((prev) => prev.filter((item) => item.id !== id))
      setBytes((prev) => Math.max(0, prev - (removed?.size ?? 0)))
      setConfirmId(null)
      toast.success('这段录音已删除')
    } catch {
      toast.error('删除失败，请稍后重试')
    } finally {
      setDeletingId(null)
    }
  }

  const renderRow = (item: RecordingMeta) => (
    <RecordingRow
      key={item.id}
      item={item}
      today={today}
      confirmId={confirmId}
      deletingId={deletingId}
      onAskDelete={setConfirmId}
      onCancelDelete={() => setConfirmId(null)}
      onConfirmDelete={(id) => void handleDelete(id)}
    />
  )

  return (
    <section className="mt-5">
      <SectionTitle
        action={
          items.length > 0 ? (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-0.5 text-2xs font-medium text-brand"
            >
              全部 {items.length} 条
              <ChevronRight size={13} />
            </button>
          ) : (
            <span className="text-2xs text-muted">保存在本机</span>
          )
        }
      >
        我的录音
      </SectionTitle>

      {loading ? (
        <div className="surface-card divide-y divide-line">
          {[0, 1].map((index) => (
            <div key={index} className="flex items-center gap-2.5 p-3.5">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<Database size={19} />}
          title="无法读取本机录音"
          description="当前浏览器可能禁用了 IndexedDB（例如隐私模式）。练习中的录音仍可在当次回放。"
          className="py-7"
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Mic size={19} />}
          title="还没有录音"
          description="练习时录下的句子会保存在本机 IndexedDB，刷新、退出再回来都还在。"
          className="py-7"
        />
      ) : (
        <>
          <div className="surface-card divide-y divide-line">
            {items.slice(0, 4).map(renderRow)}
          </div>
          <p className="mt-1.5 flex items-center gap-1 px-1 text-2xs text-muted/70">
            <Database size={11} />
            共 {items.length} 条 · {formatBytes(bytes)} · 只保存在本机
          </p>
        </>
      )}

      <Sheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false)
          setConfirmId(null)
        }}
        title="我的录音"
        description={`${items.length} 条 · ${formatBytes(bytes)} · 只保存在这台设备`}
      >
        {items.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted">
            录音已全部删除。
          </p>
        ) : (
          <div className="surface-card divide-y divide-line">{items.map(renderRow)}</div>
        )}
        <p className="mt-3 flex items-start gap-1.5 text-2xs leading-relaxed text-muted">
          <Database size={12} className="mt-0.5 shrink-0" />
          录音保存在浏览器 IndexedDB，不会上传。清除浏览器站点数据会一并删除；设置里可以一次清除全部录音。
        </p>
      </Sheet>
    </section>
  )
}
