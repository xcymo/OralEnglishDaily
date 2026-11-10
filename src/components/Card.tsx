import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({
  children,
  className,
  as: Tag = 'div',
  ...rest
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article' | 'li'
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={cn('surface-card', className)} {...rest}>
      {children}
    </Tag>
  )
}

export function SectionTitle({
  children,
  action,
  className,
}: {
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-2.5 flex items-end justify-between gap-3', className)}>
      <h2 className="text-[15px] font-bold tracking-tight">{children}</h2>
      {action}
    </div>
  )
}
