'use client'

import { useRef, useState, useTransition } from 'react'
import { X, Loader2 } from 'lucide-react'
import { upsertStockEntry } from '@/app/actions/puesto'
import type { Producto } from './producto-form'

export type StockEntry = {
  id: string
  product_id: string
  presentation: string
  quantity: number
  reorder_point: number
  price: number | null
}

interface StockEntryFormProps {
  productos: Producto[]
  entry?: StockEntry | null
  onClose: () => void
}

export function StockEntryForm({ productos, entry, onClose }: StockEntryFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!entry

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await upsertStockEntry(formData)
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
          <h2 className="text-base font-semibold text-white">
            {isEditing ? 'Editar stock' : 'Agregar presentación'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form ref={formRef} action={handleSubmit} className="p-6 space-y-4">
          {entry && <input type="hidden" name="id" value={entry.id} />}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Producto <span className="text-red-400">*</span>
            </label>
            <select
              name="product_id"
              defaultValue={entry?.product_id ?? ''}
              required
              disabled={isEditing}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all appearance-none disabled:opacity-60"
            >
              <option value="" disabled className="bg-[#0d1f38]">Seleccionar producto...</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0d1f38]">
                  {p.name} — {p.category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Presentación <span className="text-red-400">*</span>
            </label>
            <input
              name="presentation"
              defaultValue={entry?.presentation ?? ''}
              placeholder="Ej: 500ml, 1kg, 250g, unidad..."
              required
              disabled={isEditing}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Stock <span className="text-red-400">*</span>
              </label>
              <input
                name="quantity"
                type="number"
                min="0"
                step="1"
                defaultValue={entry?.quantity ?? 0}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Mínimo</label>
              <input
                name="reorder_point"
                type="number"
                min="0"
                step="1"
                defaultValue={entry?.reorder_point ?? 0}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Precio <span className="text-gray-600">($ ARS)</span>
              </label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={entry?.price ?? ''}
                placeholder="—"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all text-center"
              />
            </div>
          </div>

          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
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
              className="flex-1 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</>
              ) : (
                isEditing ? 'Guardar cambios' : 'Agregar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
