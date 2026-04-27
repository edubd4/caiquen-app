'use client'

import { useState, useTransition } from 'react'
import { Loader2, Flame } from 'lucide-react'
import { registrarProduccionReceta } from '@/app/actions/produccion'

type Receta = { id: string; name: string }
type Location = { id: string; name: string }

interface ProduccionLogFormProps {
  recetas: Receta[]
  locations: Location[]
  onSuccess?: () => void
}

export function ProduccionLogForm({ recetas, locations, onSuccess }: ProduccionLogFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await registrarProduccionReceta(formData)
      if (result.success) {
        setSuccess(result.message)
        ;(e.target as HTMLFormElement).reset()
        onSuccess?.()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="rounded-xl border border-amber-900/20 bg-white/2 p-5">
      <div className="flex items-center gap-2 mb-5">
        <Flame className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Registrar producción</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Receta <span className="text-red-400">*</span>
          </label>
          <select
            name="recipe_id"
            required
            defaultValue=""
            className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 appearance-none"
          >
            <option value="" disabled className="bg-[#0d1f38]">Seleccionar receta...</option>
            {recetas.map(r => (
              <option key={r.id} value={r.id} className="bg-[#0d1f38]">{r.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Cantidad producida <span className="text-red-400">*</span>
            </label>
            <input
              name="qty_produced"
              type="number"
              min="1"
              step="1"
              required
              placeholder="Ej: 5"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Fecha de producción</label>
            <input
              name="production_date"
              type="date"
              defaultValue={today}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Ubicación</label>
            <select
              name="location_id"
              defaultValue=""
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 appearance-none"
            >
              <option value="" className="bg-[#0d1f38]">— sin especificar —</option>
              {locations.map(l => (
                <option key={l.id} value={l.id} className="bg-[#0d1f38]">{l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Rendimiento real</label>
            <input
              name="actual_yield"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej: 11.5"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Notas</label>
          <input
            name="yield_notes"
            placeholder="Observaciones del lote, inconvenientes..."
            className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
          />
        </div>

        {error && (
          <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}
        {success && (
          <div className="px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">{success}</div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black text-sm font-semibold flex items-center justify-center gap-2 transition-all"
        >
          {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Registrando...</> : 'Registrar producción'}
        </button>
        <p className="text-xs text-gray-600 text-center">
          Al registrar, el stock de los insumos se descuenta automáticamente.
        </p>
      </form>
    </div>
  )
}
