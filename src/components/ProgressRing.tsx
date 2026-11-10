import { cn } from '@/lib/cn'

export function ProgressRing({
  value,
  size = 88,
  stroke = 8,
  children,
  className,
  label,
}: {
  value: number
  size?: number
  stroke?: number
  children?: React.ReactNode
  className?: string
  label?: string
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(1, value))
  const offset = circumference * (1 - clamped)
  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `完成 ${Math.round(clamped * 100)}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--surface-2))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--brand))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-soft"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}

export function ProgressBar({
  value,
  className,
  tone = 'brand',
  ariaLabel,
}: {
  value: number
  className?: string
  tone?: 'brand' | 'success' | 'warning'
  ariaLabel?: string
}) {
  const clamped = Math.max(0, Math.min(1, value))
  return (
    <div
      className={cn(
        'h-1.5 w-full overflow-hidden rounded-pill bg-surface-2',
        className,
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      aria-label={ariaLabel}
    >
      <div
        className={cn(
          'h-full rounded-pill transition-[width] duration-700 ease-soft',
          tone === 'brand' && 'bg-brand',
          tone === 'success' && 'bg-success',
          tone === 'warning' && 'bg-warning',
        )}
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  )
}
