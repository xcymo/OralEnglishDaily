import { BarChart3, Compass, MessageSquareText, Settings, Sun } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'

const ITEMS = [
  { to: '/', label: '今天', icon: Sun, end: true },
  { to: '/scenes', label: '场景', icon: Compass, end: false },
  { to: '/patterns', label: '句式', icon: MessageSquareText, end: false },
  { to: '/progress', label: '进度', icon: BarChart3, end: false },
  { to: '/settings', label: '设置', icon: Settings, end: false },
]

export function BottomNav() {
  return (
    <nav
      aria-label="主导航"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center"
    >
      <div className="w-full max-w-[520px] border-t border-line bg-surface/95 pb-safe shadow-nav backdrop-blur-xl">
        <div className="grid grid-cols-5 px-2 pt-1.5">
          {ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'group flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl text-2xs font-medium transition-colors duration-200',
                    isActive ? 'text-brand' : 'text-muted hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200',
                        isActive && 'bg-brand-soft',
                      )}
                    >
                      <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
