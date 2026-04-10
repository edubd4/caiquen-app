import { createClient } from '@/lib/supabase/server'
import { Bell } from 'lucide-react'

interface TopbarProps {
  title: string
  subtitle?: string
}

export async function Topbar({ title, subtitle }: TopbarProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: { full_name: string | null; role: string } | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()
    profile = data as { full_name: string | null; role: string } | null
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0].toUpperCase() ?? 'U'

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-amber-900/20 bg-[#051426]">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Notificaciones */}
        <button className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          {/* Badge de notificaciones */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold text-amber-400">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white leading-tight">
              {profile?.full_name ?? user?.email?.split('@')[0]}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {profile?.role ?? 'empleado'}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
