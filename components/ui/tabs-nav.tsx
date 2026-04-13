'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

interface Tab {
  label: string
  value: string
  count?: number
}

interface TabsNavProps {
  tabs: Tab[]
  paramName?: string // default: 'tab'
}

export function TabsNav({ tabs, paramName = 'tab' }: TabsNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get(paramName) ?? tabs[0].value

  return (
    <div className="flex gap-1 border-b border-amber-900/20 pb-0">
      {tabs.map((tab) => {
        const isActive = current === tab.value
        const params = new URLSearchParams(searchParams.toString())
        params.set(paramName, tab.value)

        return (
          <Link
            key={tab.value}
            href={`${pathname}?${params.toString()}`}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px',
              isActive
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full font-medium',
                isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-white/10 text-gray-500'
              )}>
                {tab.count}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
