import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'

interface PageHeaderProps {
  title?: string
  subtitle?: string
  back?: boolean
  onBack?: () => void
  actions?: ReactNode
  className?: string
  center?: boolean
}

export function PageHeader({
  title,
  subtitle,
  back = false,
  onBack,
  actions,
  className,
  center = false,
}: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-transparent bg-bg/85 pt-safe backdrop-blur-xl',
        className,
      )}
    >
      <div
        className={cn(
          'flex min-h-[56px] items-center gap-1.5 px-4',
          center && 'justify-between',
        )}
      >
        {back && (
          <button
            type="button"
            onClick={() => (onBack ? onBack() : navigate(-1))}
            aria-label="返回"
            className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink press hover:bg-surface-2"
          >
            <ArrowLeft size={21} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {title && (
            <h1 className="truncate text-[19px] font-bold tracking-tight">{title}</h1>
          )}
          {subtitle && (
            <p className="truncate text-[12px] text-muted">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
    </header>
  )
}

export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-brand">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-balance">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
