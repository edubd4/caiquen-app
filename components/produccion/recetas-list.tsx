'use client'

import { useState, useTransition } from 'react'
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Loader2, BookOpen } from 'lucide-react'
import { deleteReceta } from '@/app/actions/produccion'
import { RecetaForm } from './receta-form'
import { BomEditor } from './bom-editor'
import { FactibilidadChecker } from './factibilidad-checker'

type Unit = { id: string; name: string; abbreviation: string }
type Item = { id: string; name: string; item_code: string | null }
type Location = { id: string; name: string }

type BomRow = {
  id: string
  item_id: string
  unit_id: string
  quantity: number
  notes: string | null
  items: { name: string; item_code: string | null } | null
  units: { abbreviation: string } | null
}

export type Receta = {
  id: string
  name: string
  description: string | null
  notes: string | null
  yield_qty: number | null
  yield_unit: string | null
  created_at: string
  recipe_items: BomRow[]
  units: { name: string; abbreviation: string } | null
}

interface RecetasListProps {
  recetas: Receta[]
  items: Item[]
  units: Unit[]
  locations: Location[]
}

function RecetaRow({
  receta,
  items,
  units,
  locations,
}: {
  receta: Receta
  items: Item[]
  units: Unit[]
  locations: Location[]
}) {
  const [expanded, setExpanded] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [activePanel, setActivePanel] = useState<'bom' | 'factibilidad'>('bom')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm(`¿Eliminar la receta "${receta.name}"? Esta acción no se puede deshacer.`)) return
    setDeletingId(receta.id)
    startTransition(async () => {
      await deleteReceta(receta.id)
      setDeletingId(null)
    })
  }

  const bomCount = receta.recipe_items.length

  return (
    <>
      <tr className="hover:bg-white/1 transition-colors group">
        <td className="px-4 py-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-left"
          >
            {expanded
              ? <ChevronDown className="w-4 h-4 text-amber-400 shrink-0" />
              : <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />}
            <span className="font-medium text-white">{receta.name}</span>
          </button>
          {receta.description && (
            <p className="text-xs text-gray-500 mt-0.5 ml-6 truncate max-w-72">{receta.description}</p>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${
            bomCount > 0
              ? 'bg-amber-500/15 text-amber-400'
              : 'bg-white/5 text-gray-600'
          }`}>
            {bomCount} {bomCount === 1 ? 'ingrediente' : 'ingredientes'}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-400">
          {receta.yield_qty
            ? `${receta.yield_qty} ${receta.units?.abbreviation ?? ''}`
            : <span className="text-gray-600">—</span>}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
            <button
              onClick={() => setShowEdit(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
              title="Editar receta"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deletingId === receta.id}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
              title="Eliminar receta"
            >
              {deletingId === receta.id
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded panel */}
      {expanded && (
        <tr>
          <td colSpan={4} className="px-4 pb-4 pt-0 bg-white/1">
            <div className="ml-6 rounded-xl border border-amber-900/20 bg-[#0a1628]/60 overflow-hidden">
              {/* Tab bar */}
              <div className="flex border-b border-amber-900/20">
                <button
                  onClick={() => setActivePanel('bom')}
                  className={`px-4 py-2.5 text-xs font-medium transition-colors ${
                    activePanel === 'bom'
                      ? 'text-amber-400 border-b-2 border-amber-400'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Ingredientes (BOM)
                </button>
                <button
                  onClick={() => setActivePanel('factibilidad')}
                  className={`px-4 py-2.5 text-xs font-medium transition-colors ${
                    activePanel === 'factibilidad'
                      ? 'text-amber-400 border-b-2 border-amber-400'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Verificar stock
                </button>
                {receta.notes && (
                  <div className="ml-auto px-4 py-2.5 text-xs text-gray-600 italic truncate max-w-xs">
                    {receta.notes}
                  </div>
                )}
              </div>

              <div className="p-4">
                {activePanel === 'bom' && (
                  <BomEditor
                    recipeId={receta.id}
                    bomItems={receta.recipe_items}
                    items={items}
                    units={units}
                  />
                )}
                {activePanel === 'factibilidad' && (
                  <FactibilidadChecker
                    recipeId={receta.id}
                    locations={locations}
                  />
                )}
              </div>
            </div>
          </td>
        </tr>
      )}

      {showEdit && (
        <RecetaForm
          units={units}
          receta={receta}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  )
}

export function RecetasList({ recetas, items, units, locations }: RecetasListProps) {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <BookOpen className="w-4 h-4" />
          <span>{recetas.length} receta{recetas.length !== 1 ? 's' : ''}</span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4" />
          Nueva receta
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-amber-900/20 overflow-hidden">
        {recetas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-sm text-gray-500">No hay recetas. Creá la primera para comenzar.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30 transition-all"
            >
              Crear receta
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-900/20 bg-white/2">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Receta</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredientes</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rendimiento</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10">
              {recetas.map(r => (
                <RecetaRow
                  key={r.id}
                  receta={r}
                  items={items}
                  units={units}
                  locations={locations}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <RecetaForm
          units={units}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
