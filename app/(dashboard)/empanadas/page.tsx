import { Topbar } from '@/components/layout/topbar'
import { ChefHat } from 'lucide-react'

export default function EmpanadasPage() {
  return (
    <div>
      <Topbar
        title="Empanadas"
        subtitle="Stock y producción por ubicación"
      />
      <div className="p-6">
        <div className="rounded-xl border border-amber-900/20 bg-white/2 p-12 flex flex-col items-center justify-center text-center">
          <ChefHat className="w-12 h-12 text-amber-500/40 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Módulo de Empanadas</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Este módulo se construye en la <strong className="text-amber-400">Fase 2</strong>.
            Incluirá stock por sabor y ubicación (Bar / Fábrica / San Miguel) y registro de producción.
          </p>
        </div>
      </div>
    </div>
  )
}
