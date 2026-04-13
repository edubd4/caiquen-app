'use client'

import { useState, useTransition } from 'react'
import { X, Loader2, ChefHat } from 'lucide-react'
import { registrarProduccion } from '@/app/actions/empanadas'

type Flavor = { id: string; name: string; code: string }

const LOCATIONS = [
  { value: 'FABRICA', label: '🏭 Fábrica' },
  { value: 'BAR', label: '🍺 Bar' },
  { value: 'SAN_MIGUEL', label: '📍 San Miguel' },
]

export function ProduccionForm({ flavors, onClose }: { flavors: Flavor[]; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await registrarProduccion(formData)
      if (result.success) {
        onClose()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0d1f38] border border-amber-900/30 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-900/20">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Registrar producción</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form action={handleSubmit} className="p-6 space-y-4">
          {/* Sabor */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Sabor <span className="text-red-400">*</span>
            </label>
            <select
              name="flavor_id"
              required
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all appearance-none"
            >
              <option value="" disabled selected className="bg-[#0d1f38]">Seleccioná un sabor...</option>
              {flavors.map(f => (
                <option key={f.id} value={f.id} className="bg-[#0d1f38]">{f.name}</option>
              ))}
            </select>
          </div>

          {/* Cantidad + Ubicación */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Cantidad (bandejas) <span className="text-red-400">*</span>
              </label>
              <input
                name="quantity"
                type="number"
                min="1"
                step="1"
                required
                placeholder="0"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Ubicación <span className="text-red-400">*</span>
              </label>
              <select
                name="source_location"
                defaultValue="FABRICA"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all appearance-none"
              >
                {LOCATIONS.map(l => (
                  <option key={l.value} value={l.value} className="bg-[#0d1f38]">{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Fecha de producción</label>
            <input
              name="production_date"
              type="date"
              defaultValue={today}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Notas <span className="text-gray-600">(opcional)</span>
            </label>
            <input
              name="notes"
              placeholder="Ej: Lote del turno tarde, hornada #3..."
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>

          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="flex-1 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black text-sm font-semibold transition-all flex items-center justify-center gap-2">
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
