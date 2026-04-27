'use client'

import { useRef, useState, useTransition } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createProducto, updateProducto } from '@/app/actions/puesto'

export type Producto = {
  id: string
  name: string
  category: string
  notes: string | null
}

const CATEGORIAS_SUGERIDAS = [
  'Mieles', 'Mermeladas', 'Dulces Regionales', 'Aceites', 'Frutos Secos',
  'Especias', 'Conservas', 'Artesanías', 'Bebidas', 'Otros',
]

interface ProductoFormProps {
  producto?: Producto | null
  onClose: () => void
}

export function ProductoForm({ producto, onClose }: ProductoFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!producto

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = isEditing
        ? await updateProducto(producto.id, formData)
        : await createProducto(formData)

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
            {isEditing ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form ref={formRef} action={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              defaultValue={producto?.name ?? ''}
              placeholder="Ej: Miel Silvestre"
              required
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Categoría <span className="text-red-400">*</span>
            </label>
            <input
              name="category"
              defaultValue={producto?.category ?? ''}
              placeholder="Ej: Mieles"
              list="categorias-list"
              required
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
            />
            <datalist id="categorias-list">
              {CATEGORIAS_SUGERIDAS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Notas <span className="text-gray-600">(opcional)</span>
            </label>
            <input
              name="notes"
              defaultValue={producto?.notes ?? ''}
              placeholder="Marca, origen u otros detalles..."
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
            />
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
                isEditing ? 'Guardar cambios' : 'Crear producto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
