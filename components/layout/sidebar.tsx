'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ChefHat,
  Users,
  Flame,
  ShoppingBasket,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Resumen general',
  },
  {
    label: 'Stock',
    href: '/stock',
    icon: Package,
    description: 'Catálogo e inventario',
  },
  {
    label: 'Empanadas',
    href: '/empanadas',
    icon: ChefHat,
    description: 'Stock y producción',
  },
  {
    label: 'Personal',
    href: '/personal',
    icon: Users,
    description: 'Empleados y nómina',
  },
  {
    label: 'Producción',
    href: '/produccion',
    icon: Flame,
    description: 'Recetas y producción',
  },
  {
    label: 'Puesto Regional',
    href: '/puesto',
    icon: ShoppingBasket,
    description: 'Productos regionales',
  },
]

const bottomItems = [
  {
    label: 'Configuración',
    href: '/configuracion',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Header */}
      <div className="px-6 py-5 border-b border-amber-900/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm leading-tight">El Caiquen</p>
            <p className="text-xs text-amber-400/70">Sistema Operacional</p>
          </div>
        </div>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group',
                active
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  active ? 'text-amber-400' : 'text-gray-500 group-hover:text-gray-300'
                )}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{item.label}</p>
                <p className={cn(
                  'text-xs leading-tight truncate transition-colors',
                  active ? 'text-amber-400/60' : 'text-gray-600 group-hover:text-gray-500'
                )}>
                  {item.description}
                </p>
              </div>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom items */}
      <div className="px-3 py-4 border-t border-amber-900/20 space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group',
                active
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all group"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Cerrar sesión</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#0a1628] border-r border-amber-900/20 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-[#0a1628] border border-amber-900/30 rounded-lg text-gray-400 hover:text-white"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 z-50 h-full w-64 bg-[#0a1628] border-r border-amber-900/20 transform transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>
    </>
  )
}
