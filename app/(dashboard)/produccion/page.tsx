import { Topbar } from '@/components/layout/topbar'
import { Flame } from 'lucide-react'

export default function ProduccionPage() {
  return (
    <div>
      <Topbar
        title="Producción"
        subtitle="Recetas estructuradas y registro de producción"
      />
      <div className="p-6">
        <div className="rounded-xl border border-amber-900/20 bg-white/2 p-12 flex flex-col items-center justify-center text-center">
          <Flame className="w-12 h-12 text-amber-500/40 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Módulo de Producción</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Este módulo se construye en la <strong className="text-amber-400">Fase 4</strong>.
            Incluirá recetas BOM, calculadora de insumos y producción vinculada al stock.
          </p>
        </div>
      </div>
    </div>
  )
}
