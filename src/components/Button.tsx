import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'
export type ButtonSize = 'sm' | 'md' | 'lg'

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  fullWidth = false,
  className?: string,
): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight press select-none',
    'disabled:pointer-events-none disabled:opacity-45',
    size === 'sm' && 'min-h-[44px] px-3 text-[13.5px]',
    size === 'md' && 'min-h-[48px] px-4 text-[15px]',
    size === 'lg' && 'min-h-[54px] px-5 text-base',
    variant === 'primary' &&
      'bg-brand text-on-brand shadow-[0_10px_24px_-12px_rgb(var(--brand)/0.75)] hover:brightness-105',
    variant === 'secondary' &&
      'border border-line bg-surface text-ink hover:bg-surface-2',
    variant === 'ghost' && 'text-muted hover:bg-surface-2 hover:text-ink',
    variant === 'danger' && 'bg-danger/10 text-danger hover:bg-danger/15',
    variant === 'soft' && 'bg-brand-soft text-brand hover:brightness-[0.98]',
    fullWidth && 'w-full',
    className,
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      icon,
      iconRight,
      className,
      children,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses(variant, size, fullWidth, className)}
        {...rest}
      >
        {icon}
        {children}
        {iconRight}
      </button>
    )
  },
)
