import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-xl', className)} />
}

export function PageSkeleton() {
  return (
    <div className="px-4 pt-safe">
      <div className="flex h-14 items-center">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="mt-2 space-y-3">
        <Skeleton className="h-[104px] w-full rounded-card" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-card" />
          <Skeleton className="h-20 rounded-card" />
        </div>
        <Skeleton className="h-[86px] w-full rounded-card" />
        <Skeleton className="h-[86px] w-full rounded-card" />
        <Skeleton className="h-[86px] w-full rounded-card" />
      </div>
    </div>
  )
}

export function PracticeSkeleton() {
  return (
    <div className="px-4 pt-safe">
      <div className="flex h-14 items-center justify-between">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <Skeleton className="mt-2 h-1.5 w-full rounded-pill" />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-20 w-full rounded-card" />
        <Skeleton className="h-16 w-full rounded-card" />
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface/60 px-6 py-10 text-center',
        className,
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        {icon}
      </div>
      <p className="text-[15px] font-semibold">{title}</p>
      {description && (
        <p className="mt-1 max-w-[280px] text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
