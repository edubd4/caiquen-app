import { Topbar } from '@/components/layout/topbar'
import { Users } from 'lucide-react'

export default function PersonalPage() {
  return (
    <div>
      <Topbar
        title="Personal"
        subtitle="Empleados, horarios y nómina"
      />
      <div className="p-6">
        <div className="rounded-xl border border-amber-900/20 bg-white/2 p-12 flex flex-col items-center justify-center text-center">
          <Users className="w-12 h-12 text-amber-500/40 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Módulo de Personal</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Este módulo se construye en la <strong className="text-amber-400">Fase 3</strong>.
            Incluirá gestión de empleados, registro de horarios y cálculo automático de nómina semanal.
          </p>
        </div>
      </div>
    </div>
  )
}
