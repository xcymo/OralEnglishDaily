import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight,
  TriangleAlert,
  Trash2,
} from 'lucide-react'
import type { StuckNote } from '@/types'
import { getPattern, getScene } from '@/content'
import { relativeDay } from '@/lib/date'
import { useProgress } from '@/store/progress'
import { SectionTitle } from './Card'
import { EmptyState } from './Skeleton'
import { Sheet } from './Sheet'

function noteTarget(note: StuckNote): string {
  const scene = note.sceneId ? getScene(note.sceneId) : undefined
  const pattern = note.kind === 'pattern' ? getPattern(note.refId) : undefined
  if (scene) return `/scenes/${scene.id}`
  if (pattern) return `/patterns/${pattern.id}`
  return '/scenes'
}

function StuckNoteRow({
  note,
  today,
  confirmId,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  note: StuckNote
  today: string
  confirmId: string | null
  onAskDelete: (id: string) => void
  onCancelDelete: () => void
  onConfirmDelete: (id: string) => void
}) {
  return (
    <div className="flex items-start gap-1.5 px-3.5 py-2.5">
      <Link
        to={noteTarget(note)}
        className="press flex min-h-[44px] min-w-0 flex-1 items-start gap-2.5"
      >
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
          <TriangleAlert size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold">{note.text}</p>
          <p className="mt-0.5 line-clamp-1 text-2xs text-muted">{note.note}</p>
          <p className="mt-0.5 text-2xs text-muted/70">
            {relativeDay(note.date, today)}
          </p>
        </div>
        <ChevronRight size={15} className="mt-1 shrink-0 text-muted" />
      </Link>
      {confirmId === note.id ? (
        <div className="flex shrink-0 items-center gap-1 pt-0.5">
          <button
            type="button"
            onClick={onCancelDelete}
            className="min-h-[44px] min-w-[44px] rounded-lg px-1.5 text-2xs text-muted"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => onConfirmDelete(note.id)}
            className="min-h-[44px] rounded-lg bg-danger/10 px-2.5 text-2xs font-semibold text-danger"
          >
            删除
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onAskDelete(note.id)}
          aria-label="删除这条卡壳记录"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-danger"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  )
}

/** 进度页的「不会说清单」：查看、进入对应场景/句式、单条删除、清空 */
export function StuckNotesPanel({ today }: { today: string }) {
  const { progress, removeStuckNote, clearStuckNotes } = useProgress()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const notes = progress.stuckNotes
  const visible = notes.slice(0, 4)

  const closeSheet = () => {
    setSheetOpen(false)
    setConfirmId(null)
    setConfirmClear(false)
  }

  const row = (note: StuckNote) => (
    <StuckNoteRow
      key={note.id}
      note={note}
      today={today}
      confirmId={confirmId}
      onAskDelete={setConfirmId}
      onCancelDelete={() => setConfirmId(null)}
      onConfirmDelete={(id) => {
        removeStuckNote(id)
        setConfirmId(null)
      }}
    />
  )

  return (
    <section className="mt-5">
      <SectionTitle
        action={
          notes.length > 0 ? (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-0.5 text-2xs font-medium text-brand"
            >
              全部 {notes.length} 条
              <ChevronRight size={13} />
            </button>
          ) : (
            <span className="text-2xs text-muted">0 条</span>
          )
        }
      >
        不会说清单
      </SectionTitle>

      {notes.length === 0 ? (
        <EmptyState
          icon={<TriangleAlert size={19} />}
          title="还没有卡壳记录"
          description="练习时点「卡住了」，这里就会攒下你最想学会的那些句子。"
          className="py-7"
        />
      ) : (
        <>
          <div className="surface-card divide-y divide-line">
            {visible.map(row)}
          </div>
          {notes.length > visible.length && (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="mt-1.5 flex min-h-[44px] w-full items-center justify-center gap-0.5 text-2xs font-medium text-brand"
            >
              还有 {notes.length - visible.length} 条，查看全部
              <ChevronRight size={12} />
            </button>
          )}
        </>
      )}

      <Sheet
        open={sheetOpen}
        onClose={closeSheet}
        title="不会说清单"
        description={`共 ${notes.length} 条 · 点垃圾桶可以移除`}
      >
        {notes.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted">清单已经清空了。</p>
        ) : (
          <>
            <div className="surface-card divide-y divide-line">{notes.map(row)}</div>
            <div className="mt-3">
              {confirmClear ? (
                <div className="flex items-center gap-2 rounded-xl bg-danger/10 p-2.5">
                  <p className="min-w-0 flex-1 text-2xs leading-relaxed text-danger">
                    清空后无法恢复，确定吗？
                  </p>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="min-h-[44px] min-w-[44px] rounded-lg px-1.5 text-2xs text-muted"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearStuckNotes()
                      setConfirmClear(false)
                      setSheetOpen(false)
                      setConfirmId(null)
                    }}
                    className="min-h-[44px] rounded-lg bg-danger px-2.5 text-2xs font-semibold text-on-brand"
                  >
                    确定清空
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="inline-flex min-h-[44px] items-center gap-1.5 text-[12.5px] font-medium text-danger"
                >
                  <Trash2 size={14} />
                  清空清单
                </button>
              )}
            </div>
          </>
        )}
        <p className="mt-3 text-2xs leading-relaxed text-muted">
          删除只影响这份清单，不会改变已经完成的练习和复习安排。
        </p>
      </Sheet>
    </section>
  )
}
