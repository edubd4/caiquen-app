'use client'

import { useTransition, useState } from 'react'
import { Loader2, Shield, User } from 'lucide-react'
import { updateUserRole } from '@/app/actions/config'

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

interface UsersTableProps {
  profiles: Profile[]
}

export function UsersTable({ profiles }: UsersTableProps) {
  const [isPending, startTransition] = useTransition()
  const [changingId, setChangingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRoleChange(userId: string, newRole: 'admin' | 'empleado') {
    setError(null)
    setChangingId(userId)
    const fd = new FormData()
    fd.set('user_id', userId)
    fd.set('role', newRole)
    startTransition(async () => {
      const result = await updateUserRole(fd)
      if (!result.success) setError(result.error)
      setChangingId(null)
    })
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-900/20 bg-[#0a1628] overflow-hidden">
        {profiles.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-500">No hay usuarios registrados.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-900/20 bg-white/2">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Miembro desde</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id} className="border-b border-amber-900/10 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-amber-400">
                          {(profile.full_name ?? profile.email)[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-white">
                        {profile.full_name ?? '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-gray-400 text-xs">{profile.email}</span>
                  </td>
                  <td className="px-5 py-3">
                    {changingId === profile.id && isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <select
                        value={profile.role}
                        onChange={(e) => handleRoleChange(profile.id, e.target.value as 'admin' | 'empleado')}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50 appearance-none cursor-pointer transition-all"
                      >
                        <option value="admin" className="bg-[#0d1f38]">Admin</option>
                        <option value="empleado" className="bg-[#0d1f38]">Empleado</option>
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-gray-600 text-xs">
                      {new Date(profile.created_at).toLocaleDateString('es-AR', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {error && (
        <div className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Info: agregar usuarios */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-900/20 bg-white/2">
        <div className="flex gap-2 mt-0.5">
          <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-400">¿Cómo agregar nuevos usuarios?</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Los usuarios se crean desde el panel de{' '}
            <a
              href="https://supabase.com/dashboard/project/zuinxdycjuiunlfuiopv/auth/users"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
            >
              Supabase Authentication
            </a>
            . Una vez creados, aparecen aquí y podés asignarles el rol.
          </p>
        </div>
      </div>
    </div>
  )
}
