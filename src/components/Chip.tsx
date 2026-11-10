import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type ChipTone = 'default' | 'active' | 'brand' | 'success' | 'warning'

interface ChipProps {
  children: ReactNode
  active?: boolean
  onClick?: () => void
  tone?: ChipTone
  className?: string
  /** 静态标签（不可点击）不需要 44px 触控高度 */
  static?: boolean
  icon?: ReactNode
  title?: string
}

export function Chip({
  children,
  active = false,
  onClick,
  tone = 'default',
  className,
  static: isStatic = false,
  icon,
  title,
}: ChipProps) {
  const classes = cn(
    'inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border px-3 text-[13px] font-medium transition-colors duration-200',
    isStatic ? 'min-h-[26px] py-0.5' : 'min-h-[44px] min-w-[44px] justify-center py-2',
    active
      ? 'border-brand bg-brand text-on-brand shadow-[0_6px_16px_-10px_rgb(var(--brand)/0.8)]'
      : tone === 'brand'
        ? 'border-transparent bg-brand-soft text-brand'
        : tone === 'success'
          ? 'border-success/15 bg-success/10 text-success'
          : tone === 'warning'
            ? 'border-warning/15 bg-warning/10 text-warning'
            : 'border-line bg-surface text-muted',
    isStatic && !active && tone === 'default' && 'bg-surface-2 text-muted',
    onClick && 'press active:bg-surface-2',
    className,
  )

  if (isStatic || !onClick) {
    return (
      <span className={classes} title={title}>
        {icon}
        {children}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={classes}
      title={title}
    >
      {icon}
      {children}
    </button>
  )
}

interface SegmentedProps<T extends string> {
  value: T
  options: { value: T; label: string; hint?: string }[]
  onChange: (value: T) => void
  ariaLabel: string
  className?: string
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'flex gap-1 rounded-2xl border border-line bg-surface-2 p-1',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-h-[44px] flex-1 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-[13.5px] font-semibold transition-all duration-200',
              active
                ? 'bg-surface text-ink shadow-card'
                : 'text-muted hover:text-ink',
            )}
          >
            <span>{option.label}</span>
            {option.hint && (
              <span className="text-2xs font-normal text-muted">{option.hint}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function TagBadge({
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLSpanElement> & { children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-2xs font-medium text-muted',
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}
