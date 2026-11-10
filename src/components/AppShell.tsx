import { useLocation } from 'react-router-dom'
import { useEffect, type ReactNode } from 'react'
import { BottomNav } from './BottomNav'

function shouldHideNav(pathname: string): boolean {
  if (pathname.startsWith('/practice')) return true
  if (/^\/scenes\/[^/]+$/.test(pathname)) return true
  if (/^\/patterns\/[^/]+$/.test(pathname)) return true
  return false
}

/** 移动优先的应用外壳：手机满宽，桌面居中为 520px 的「手机容器」 */
export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const hideNav = shouldHideNav(pathname)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-dvh justify-center">
      <div className="relative min-h-dvh w-full max-w-[520px] bg-bg sm:bg-bg sm:shadow-[0_0_0_1px_rgb(var(--border)),0_30px_90px_-50px_rgb(var(--shadow)/0.45)]">
        <main key={pathname} className={hideNav ? 'min-h-dvh' : 'pb-nav'}>
          {children}
        </main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  )
}
