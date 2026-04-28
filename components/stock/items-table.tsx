'use client'

import { useState, useMemo, useTransition } from 'react'
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle, CheckCircle, Loader2, ChevronDown, ChevronRight, MapPin } from 'lucide-react'
import { ItemForm } from './item-form'
import { deleteItem } from '@/app/actions/stock'
import { updateReorderPoint } from '@/app/actions/stock-current'

type Category = { id: string; name: string }
type Unit = { id: string; name: string; abbreviation: string }
type Supplier = { id: string; name: string }

// Tipo que refleja el JOIN de items + relaciones + stock_current
export type StockItem = {
  id: string
  item_code: string
  name: string
  notes: string | null
  category_id: string
  unit_id: string
  supplier_id: string | null
  price: number | null
  categories: { name: string } | null
  units: { name: string; abbreviation: string } | null
  suppliers: { name: string } | null
  // stock_current tiene reorder_point por ubicación
  stock_current: { quantity: number; location_id: string; reorder_point: number }[]
}

type Location = { id: string; name: string }

interface ItemsTableProps {
  items: StockItem[]
  categories: Category[]
  units: Unit[]
  suppliers: Supplier[]
  locations?: Location[]
}

function StockBadge({ quantity, reorder }: { quantity: number; reorder: number }) {
  if (quantity === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Sin stock
      </span>
    )
  }
  if (quantity <= reorder) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400">
        <AlertTriangle className="w-3 h-3" />
        Bajo mínimo
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/15 text-green-400">
      <CheckCircle className="w-3 h-3" />
      OK
    </span>
  )
}

// ─── Subcomponente: stock por ubicación (fila expandida) ─────────────────
function StockPorUbicacion({ item, locations = [] }: { item: StockItem; locations?: Location[] }) {
  const [saving, setSaving] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const handleReorder = (locationId: string, formData: FormData) => {
    setSaving(locationId)
    startTransition(async () => {
      await updateReorderPoint(formData)
      setSaving(null)
    })
  }

  if (!item.stock_current || item.stock_current.length === 0) {
    return (
      <div className="px-4 py-3 text-xs text-gray-600 flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5" />
        Sin registros de stock por ubicación. Registrá una entrada para inicializar.
      </div>
    )
  }

  return (
    <div className="px-4 py-3 space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Stock por ubicación</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {item.stock_current.map((sc) => (
          <form
            key={sc.location_id}
            action={(fd) => handleReorder(sc.location_id, fd)}
            className="flex items-center gap-2 p-2.5 rounded-lg bg-white/3 border border-white/8"
          >
            <input type="hidden" name="item_id" value={item.id} />
            <input type="hidden" name="location_id" value={sc.location_id} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 truncate">
                {locations.find(l => l.id === sc.location_id)?.name ?? sc.location_id}
              </p>
              <p className="text-sm font-semibold text-white tabular-nums">
                {sc.quantity % 1 === 0 ? sc.quantity : sc.quantity.toFixed(2)}
                <span className="text-xs font-normal text-gray-500 ml-1">{item.units?.abbreviation}</span>
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-xs text-gray-600">mín</span>
              <input
                name="reorder_point"
                type="number"
                min="0"
                step="0.01"
                defaultValue={sc.reorder_point}
                className="w-16 px-1.5 py-1 rounded text-xs bg-white/5 border border-white/10 text-white text-center focus:outline-none focus:border-amber-500/50"
              />
              <button
                type="submit"
                disabled={saving === sc.location_id}
                className="p-1 rounded text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-50"
                title="Guardar mínimo"
              >
                {saving === sc.location_id
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <CheckCircle className="w-3 h-3" />
                }
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────

export function ItemsTable({ items, categories, units, suppliers, locations = [] }: ItemsTableProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'ok' | 'bajo' | 'sin_stock'>('')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<StockItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Para el semáforo: usamos el máximo reorder_point de todas las ubicaciones del ítem
  // y la suma total de stock
  const getItemStockInfo = (item: StockItem) => {
    const totalQuantity = item.stock_current?.reduce((sum, s) => sum + (s.quantity || 0), 0) ?? 0
    const maxReorder = item.stock_current?.reduce((max, s) => Math.max(max, s.reorder_point || 0), 0) ?? 0
    return { totalQuantity, maxReorder }
  }

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const { totalQuantity, maxReorder } = getItemStockInfo(item)
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.item_code?.toLowerCase().includes(search.toLowerCase())
      const matchCategory = !categoryFilter || item.category_id === categoryFilter
      const matchStatus =
        !statusFilter ||
        (statusFilter === 'sin_stock' && totalQuantity === 0) ||
        (statusFilter === 'bajo' && totalQuantity > 0 && totalQuantity <= maxReorder) ||
        (statusFilter === 'ok' && (maxReorder === 0 || totalQuantity > maxReorder))

      return matchSearch && matchCategory && matchStatus
    })
  }, [items, search, categoryFilter, statusFilter])

  const stats = useMemo(() => {
    let sinStock = 0, bajoMinimo = 0
    items.forEach(i => {
      const { totalQuantity, maxReorder } = getItemStockInfo(i)
      if (totalQuantity === 0) sinStock++
      else if (maxReorder > 0 && totalQuantity <= maxReorder) bajoMinimo++
    })
    return { total: items.length, sinStock, bajoMinimo }
  }, [items])

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este ítem? Esta acción no se puede deshacer.')) return
    setDeletingId(id)
    startTransition(async () => {
      await deleteItem(id)
      setDeletingId(null)
    })
  }

  const handleEdit = (item: StockItem) => {
    setEditingItem(item)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingItem(null)
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-amber-900/20 bg-white/2 px-4 py-3">
          <p className="text-xs text-gray-500">Total ítems</p>
          <p className="text-xl font-bold text-white mt-0.5">{stats.total}</p>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${stats.bajoMinimo > 0 ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-900/20 bg-white/2'}`}>
          <p className="text-xs text-gray-500">Bajo mínimo</p>
          <p className={`text-xl font-bold mt-0.5 ${stats.bajoMinimo > 0 ? 'text-amber-400' : 'text-white'}`}>{stats.bajoMinimo}</p>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${stats.sinStock > 0 ? 'border-red-500/20 bg-red-500/5' : 'border-amber-900/20 bg-white/2'}`}>
          <p className="text-xs text-gray-500">Sin stock</p>
          <p className={`text-xl font-bold mt-0.5 ${stats.sinStock > 0 ? 'text-red-400' : 'text-white'}`}>{stats.sinStock}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all appearance-none min-w-40"
        >
          <option value="" className="bg-[#0d1f38]">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id} className="bg-[#0d1f38]">{c.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all appearance-none min-w-40"
        >
          <option value="" className="bg-[#0d1f38]">Todos los estados</option>
          <option value="ok" className="bg-[#0d1f38]">✅ OK</option>
          <option value="bajo" className="bg-[#0d1f38]">⚠️ Bajo mínimo</option>
          <option value="sin_stock" className="bg-[#0d1f38]">🔴 Sin stock</option>
        </select>

        <button
          onClick={() => { setEditingItem(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Nuevo ítem
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-amber-900/20 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-sm text-gray-500">
              {items.length === 0
                ? 'El catálogo está vacío. Agregá el primer ítem.'
                : 'Sin resultados para los filtros aplicados.'}
            </p>
            {items.length === 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30 transition-all"
              >
                Crear el primer ítem
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-900/20 bg-white/2">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Stock total</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const { totalQuantity, maxReorder } = getItemStockInfo(item)
                  const isExpanded = expandedId === item.id
                  return (
                    <>
                      <tr
                        key={item.id}
                        className={`border-b border-amber-900/10 hover:bg-white/2 transition-colors group cursor-pointer ${isExpanded ? 'bg-white/3' : ''}`}
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {isExpanded
                              ? <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                              : <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                            }
                            <span className="font-mono text-xs text-amber-400/70">{item.item_code || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{item.name}</p>
                          {item.notes && (
                            <p className="text-xs text-gray-600 truncate max-w-48">{item.notes}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-300 text-sm">{item.categories?.name ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-400 text-xs bg-white/5 px-1.5 py-0.5 rounded">
                            {item.units?.abbreviation ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-white tabular-nums">
                            {totalQuantity % 1 === 0 ? totalQuantity : totalQuantity.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StockBadge quantity={totalQuantity} reorder={maxReorder} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-500 text-xs">{item.suppliers?.name ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                              title="Eliminar"
                            >
                              {deletingId === item.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Trash2 className="w-3.5 h-3.5" />
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${item.id}-detail`} className="border-b border-amber-900/10 bg-white/1">
                          <td colSpan={8} className="p-0">
                            <StockPorUbicacion item={item} locations={locations} />
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-gray-600 text-right">
          Mostrando {filtered.length} de {items.length} ítems
        </p>
      )}

      {showForm && (
        <ItemForm
          categories={categories}
          units={units}
          suppliers={suppliers}
          item={editingItem}
          onClose={handleCloseForm}
        />
      )}
    </div>
  )
}
