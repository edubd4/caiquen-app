import { Topbar } from '@/components/layout/topbar'
import { Package } from 'lucide-react'

export default function StockPage() {
  return (
    <div>
      <Topbar
        title="Stock"
        subtitle="Catálogo maestro e inventario"
      />
      <div className="p-6">
        <div className="rounded-xl border border-amber-900/20 bg-white/2 p-12 flex flex-col items-center justify-center text-center">
          <Package className="w-12 h-12 text-amber-500/40 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Módulo de Stock</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Este módulo se construye en la <strong className="text-amber-400">Fase 1</strong>.
            Incluirá catálogo maestro de ítems, stock por ubicación y ledger de movimientos.
          </p>
        </div>
      </div>
    </div>
  )
}
