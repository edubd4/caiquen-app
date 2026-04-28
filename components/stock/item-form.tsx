'use client'

import { useRef, useState, useTransition } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createItem, updateItem } from '@/app/actions/stock'

type Category = { id: string; name: string }
type Unit = { id: string; name: string; abbreviation: string }
type Supplier = { id: string; name: string }

type Item = {
  id: string
  name: string
  notes: string | null
  category_id: string
  unit_id: string
  supplier_id: string | null
  price: number | null
}

interface ItemFormProps {
  categories: Category[]
  units: Unit[]
  suppliers: Supplier[]
  item?: Item | null
  onClose: () => void
}

export function ItemForm({ categories, units, suppliers, item, onClose }: ItemFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!item

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = isEditing
        ? await updateItem(item.id, formData)
        : await createItem(formData)

      if (result.success) {
        onClose()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0d1f38] border border-amber-900/30 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-900/20">
          <h2 className="text-base font-semibold text-white">
            {isEditing ? 'Editar ítem' : 'Nuevo ítem'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} action={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              defaultValue={item?.name ?? ''}
              placeholder="Ej: Harina 000"
              required
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-all"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Notas <span className="text-gray-600">(opcional)</span>
            </label>
            <input
              name="notes"
              defaultValue={item?.notes ?? ''}
              placeholder="Marca, presentación u otros detalles..."
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>

          {/* Categoría + Unidad en fila */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Categoría <span className="text-red-400">*</span>
              </label>
              <select
                name="category_id"
                defaultValue={item?.category_id ?? ''}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all appearance-none"
              >
                <option value="" disabled className="bg-[#0d1f38]">Seleccionar...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0d1f38]">{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Unidad <span className="text-red-400">*</span>
              </label>
              <select
                name="unit_id"
                defaultValue={item?.unit_id ?? ''}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all appearance-none"
              >
                <option value="" disabled className="bg-[#0d1f38]">Seleccionar...</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id} className="bg-[#0d1f38]">{u.name} ({u.abbreviation})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Precio */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Precio unitario <span className="text-gray-600">($ ARS, opcional)</span>
            </label>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={item?.price ?? ''}
              placeholder="0.00"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>

          {/* Proveedor */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Proveedor <span className="text-gray-600">(opcional)</span>
            </label>
            <select
              name="supplier_id"
              defaultValue={item?.supplier_id ?? ''}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all appearance-none"
            >
              <option value="" className="bg-[#0d1f38]">Sin asignar</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#0d1f38]">{s.name}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
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
              className="flex-1 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-black text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                isEditing ? 'Guardar cambios' : 'Crear ítem'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
