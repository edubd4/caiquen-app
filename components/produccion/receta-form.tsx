'use client'

import { useState, useTransition } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createReceta, updateReceta } from '@/app/actions/produccion'

type Unit = { id: string; name: string; abbreviation: string }

type Receta = {
  id: string
  name: string
  description: string | null
  notes: string | null
  yield_qty: number | null
  yield_unit: string | null
}

interface RecetaFormProps {
  units: Unit[]
  receta?: Receta | null
  onClose: () => void
}

export function RecetaForm({ units, receta, onClose }: RecetaFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!receta

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = isEdit
        ? await updateReceta(receta!.id, formData)
        : await createReceta(formData)
      if (result.success) onClose()
      else setError(result.error)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0d1f38] border border-amber-900/30 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-900/20">
          <h2 className="text-base font-semibold text-white">
            {isEdit ? 'Editar receta' : 'Nueva receta'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form action={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              defaultValue={receta?.name ?? ''}
              required
              placeholder="Ej: Empanada de carne, Tarta caprese..."
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Descripción</label>
            <input
              name="description"
              defaultValue={receta?.description ?? ''}
              placeholder="Descripción breve..."
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Rendimiento (qty)</label>
              <input
                name="yield_qty"
                type="number"
                min="0"
                step="0.01"
                defaultValue={receta?.yield_qty ?? ''}
                placeholder="Ej: 12"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Unidad de rendimiento</label>
              <select
                name="yield_unit"
                defaultValue={receta?.yield_unit ?? ''}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 appearance-none"
              >
                <option value="" className="bg-[#0d1f38]">— sin unidad —</option>
                {units.map(u => (
                  <option key={u.id} value={u.id} className="bg-[#0d1f38]">
                    {u.name} ({u.abbreviation})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Notas internas</label>
            <textarea
              name="notes"
              defaultValue={receta?.notes ?? ''}
              rows={2}
              placeholder="Instrucciones especiales, tips de elaboración..."
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all resize-none"
            />
          </div>
          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black text-sm font-semibold flex items-center justify-center gap-2"
            >
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : isEdit ? 'Guardar cambios' : 'Crear receta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
