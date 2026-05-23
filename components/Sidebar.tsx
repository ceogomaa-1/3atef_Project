'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, CalendarDays, Hotel, FileText, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3, exact: true },
  { href: '/dashboard/events', label: 'Events', icon: CalendarDays },
  { href: '/dashboard/hotels', label: 'Hotels', icon: Hotel },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
  { href: '/dashboard/upload', label: 'Upload', icon: Upload },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-white/8 bg-[#0d0d0d]">
      <div className="flex h-14 items-center px-5 border-b border-white/8">
        <span className="text-sm font-bold text-[#f5f5f5] tracking-tight">3atef</span>
        <span className="ml-1.5 text-[10px] text-[#888] font-medium uppercase tracking-widest">Intel</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
            const isRoot = href === '/dashboard' && pathname === '/dashboard'
          const isActive = isRoot || (!exact && pathname.startsWith(href) && href !== '/dashboard')

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                (isRoot || isActive)
                  ? 'bg-white/8 text-[#f5f5f5]'
                  : 'text-[#888] hover:bg-white/5 hover:text-[#f5f5f5]'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-white/8">
        <div className="text-[10px] text-[#555]">AI Event Intelligence</div>
        <div className="text-[10px] text-[#444] mt-0.5">v1.0.0 — Phase 1</div>
      </div>
    </aside>
  )
}
