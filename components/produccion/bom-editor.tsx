'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Loader2, Package } from 'lucide-react'
import { addBomItem, removeBomItem } from '@/app/actions/produccion'

type Item = { id: string; name: string; item_code: string | null }
type Unit = { id: string; name: string; abbreviation: string }
type BomRow = {
  id: string
  item_id: string
  unit_id: string
  quantity: number
  notes: string | null
  items: { name: string; item_code: string | null } | null
  units: { abbreviation: string } | null
}

interface BomEditorProps {
  recipeId: string
  bomItems: BomRow[]
  items: Item[]
  units: Unit[]
}

export function BomEditor({ recipeId, bomItems, items, units }: BomEditorProps) {
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = (formData: FormData) => {
    setError(null)
    formData.set('recipe_id', recipeId)
    startTransition(async () => {
      const result = await addBomItem(formData)
      if (result.success) setShowForm(false)
      else setError(result.error)
    })
  }

  const handleRemove = (id: string) => {
    if (!confirm('¿Eliminar este ingrediente de la receta?')) return
    setRemovingId(id)
    startTransition(async () => {
      await removeBomItem(id)
      setRemovingId(null)
    })
  }

  return (
    <div className="space-y-3">
      {/* Ingredient list */}
      {bomItems.length === 0 ? (
        <div className="flex items-center gap-2 py-3 px-4 rounded-lg bg-white/2 border border-dashed border-white/10">
          <Package className="w-4 h-4 text-gray-600 shrink-0" />
          <p className="text-xs text-gray-600">Sin ingredientes. Agregá los insumos que componen esta receta.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-900/20 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-amber-900/20 bg-white/2">
                <th className="text-left px-3 py-2 text-gray-500 font-medium uppercase tracking-wider">Ingrediente</th>
                <th className="text-right px-3 py-2 text-gray-500 font-medium uppercase tracking-wider">Cantidad</th>
                <th className="text-left px-3 py-2 text-gray-500 font-medium uppercase tracking-wider">Notas</th>
                <th className="w-8 px-2 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10">
              {bomItems.map(row => (
                <tr key={row.id} className="hover:bg-white/1 transition-colors group">
                  <td className="px-3 py-2">
                    <span className="text-white font-medium">{row.items?.name ?? '—'}</span>
                    {row.items?.item_code && (
                      <span className="text-gray-600 ml-1">({row.items.item_code})</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <span className="text-amber-400 font-medium">{row.quantity}</span>
                    <span className="text-gray-500 ml-1">{row.units?.abbreviation ?? ''}</span>
                  </td>
                  <td className="px-3 py-2 text-gray-500">{row.notes ?? '—'}</td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => handleRemove(row.id)}
                      disabled={removingId === row.id}
                      className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    >
                      {removingId === row.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Trash2 className="w-3 h-3" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add ingredient form */}
      {showForm ? (
        <form action={handleAdd} className="p-3 rounded-lg bg-white/3 border border-amber-500/20 space-y-3">
          <p className="text-xs font-medium text-amber-400">Agregar ingrediente</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <select
                name="item_id"
                required
                defaultValue=""
                className="w-full px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500/50 appearance-none"
              >
                <option value="" disabled className="bg-[#0d1f38]">Seleccionar insumo...</option>
                {items.map(it => (
                  <option key={it.id} value={it.id} className="bg-[#0d1f38]">
                    {it.item_code ? `[${it.item_code}] ` : ''}{it.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input
                name="quantity"
                type="number"
                min="0.001"
                step="0.001"
                required
                placeholder="Cantidad"
                className="w-full px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>
            <div>
              <select
                name="unit_id"
                required
                defaultValue=""
                className="w-full px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500/50 appearance-none"
              >
                <option value="" disabled className="bg-[#0d1f38]">Unidad...</option>
                {units.map(u => (
                  <option key={u.id} value={u.id} className="bg-[#0d1f38]">
                    {u.abbreviation} — {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <input
                name="notes"
                placeholder="Nota opcional..."
                className="w-full px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>
          </div>
          {error && (
            <div className="px-2.5 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null) }}
              className="flex-1 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white text-xs font-medium transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black text-xs font-semibold flex items-center justify-center gap-1"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Agregar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar ingrediente
        </button>
      )}
    </div>
  )
}
