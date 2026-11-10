import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Check, Flame, Clock } from 'lucide-react'
import { Button } from './Button'

const CONFETTI_COLORS = [
  'rgb(var(--brand))',
  'rgb(var(--brand-2))',
  'rgb(var(--warning))',
  'rgb(var(--success))',
  '#f472b6',
]

export function Celebration({
  open,
  title,
  minutes,
  streak,
  doneToday,
  totalToday,
  hasNext,
  onClose,
  onNext,
}: {
  open: boolean
  title: string
  minutes: number
  streak: number
  doneToday: number
  totalToday: number
  hasNext: boolean
  onClose: () => void
  onNext: () => void
}) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        left: `${5 + ((index * 37) % 90)}%`,
        dx: `${((index * 53) % 120) - 60}px`,
        rot: `${((index * 71) % 360) - 180}deg`,
        delay: `${(index % 6) * 60}ms`,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        size: 6 + (index % 3) * 3,
        round: index % 2 === 0,
      })),
    [],
  )

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-label="练习完成"
    >
      <div className="absolute inset-0 bg-[rgb(8_10_16/0.5)] backdrop-blur-sm" />
      <div className="pointer-events-none absolute inset-x-0 top-16 mx-auto h-0 max-w-[520px] overflow-visible">
        {pieces.map((piece, index) => (
          <span
            key={index}
            className="absolute top-0 animate-confetti"
            style={{
              left: piece.left,
              width: piece.size,
              height: piece.size * (piece.round ? 1 : 1.6),
              borderRadius: piece.round ? 999 : 2,
              backgroundColor: piece.color,
              animationDelay: piece.delay,
              ['--dx' as string]: piece.dx,
              ['--rot' as string]: piece.rot,
            }}
          />
        ))}
      </div>
      <div className="relative w-full max-w-[380px] animate-scale-in rounded-3xl bg-surface p-6 text-center shadow-lift">
        <div className="mx-auto flex h-16 w-16 animate-pop items-center justify-center rounded-full bg-success/10 text-success">
          <Check size={34} strokeWidth={3} />
        </div>
        <h2 className="mt-4 text-[21px] font-extrabold tracking-tight">
          完成！说得不错
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">{title}</p>
        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-surface-2 py-3">
          <div>
            <p className="flex items-center justify-center gap-1 text-[15px] font-bold">
              <Clock size={15} className="text-brand" />
              {minutes}
              <span className="text-2xs font-medium text-muted">分</span>
            </p>
            <p className="text-2xs text-muted">本次用时</p>
          </div>
          <div className="border-x border-line">
            <p className="flex items-center justify-center gap-1 text-[15px] font-bold">
              <Flame size={15} className="text-warning" />
              {streak}
              <span className="text-2xs font-medium text-muted">天</span>
            </p>
            <p className="text-2xs text-muted">连续打卡</p>
          </div>
          <div>
            <p className="text-[15px] font-bold">
              {doneToday}
              <span className="text-2xs font-medium text-muted">/{totalToday}</span>
            </p>
            <p className="text-2xs text-muted">今日任务</p>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          {hasNext ? (
            <>
              <Button fullWidth size="lg" onClick={onNext} iconRight={<ArrowRight size={18} />}>
                继续下一项
              </Button>
              <Button fullWidth variant="ghost" onClick={onClose}>
                先歇一下
              </Button>
            </>
          ) : (
            <Button fullWidth size="lg" onClick={onClose}>
              回今天
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
