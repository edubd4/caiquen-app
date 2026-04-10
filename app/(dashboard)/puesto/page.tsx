import { Topbar } from '@/components/layout/topbar'
import { ShoppingBasket } from 'lucide-react'

export default function PuestoPage() {
  return (
    <div>
      <Topbar
        title="Puesto Regional"
        subtitle="Productos regionales y stock"
      />
      <div className="p-6">
        <div className="rounded-xl border border-amber-900/20 bg-white/2 p-12 flex flex-col items-center justify-center text-center">
          <ShoppingBasket className="w-12 h-12 text-amber-500/40 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Módulo Puesto Regional</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Este módulo se construye en la <strong className="text-amber-400">Fase 5</strong>.
            Incluirá gestión de dulces, mieles, frutos secos y aceites artesanales.
          </p>
        </div>
      </div>
    </div>
  )
}
