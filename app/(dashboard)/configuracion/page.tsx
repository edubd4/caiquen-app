import { Topbar } from '@/components/layout/topbar'
import { Settings } from 'lucide-react'

export default function ConfiguracionPage() {
  return (
    <div>
      <Topbar
        title="Configuración"
        subtitle="Solo administradores"
      />
      <div className="p-6">
        <div className="rounded-xl border border-amber-900/20 bg-white/2 p-12 flex flex-col items-center justify-center text-center">
          <Settings className="w-12 h-12 text-amber-500/40 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Configuración del sistema</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Gestión de usuarios, roles, proveedores y parámetros del sistema.
            Disponible solo para administradores.
          </p>
        </div>
      </div>
    </div>
  )
}
