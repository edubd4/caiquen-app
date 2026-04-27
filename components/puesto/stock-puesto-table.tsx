'use client'

import { useState, useMemo, useTransition } from 'react'
import { Plus, Search, Edit2, AlertTriangle, CheckCircle, Package } from 'lucide-react'
import { StockEntryForm, type StockEntry } from './stock-entry-form'
import type { Producto } from './producto-form'

export type StockConProducto = StockEntry & {
  regional_products: { name: string; category: string } | null
}

interface StockPuestoTableProps {
  stock: StockConProducto[]
  productos: Producto[]
}

function Semaforo({ quantity, reorder }: { quantity: number; reorder: number }) {
  if (quantity === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Sin stock
      </span>
    )
  }
  if (reorder > 0 && quantity < reorder) {
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

export function StockPuestoTable({ stock, productos }: StockPuestoTableProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null)
  const [, startTransition] = useTransition()

  void startTransition

  const categorias = useMemo(() => {
    const set = new Set(stock.map((s) => s.regional_products?.category).filter(Boolean))
    return Array.from(set).sort() as string[]
  }, [stock])

  const filtered = useMemo(() => {
    return stock.filter((s) => {
      const nombre = s.regional_products?.name ?? ''
      const categoria = s.regional_products?.category ?? ''
      const matchSearch =
        !search ||
        nombre.toLowerCase().includes(search.toLowerCase()) ||
        s.presentation.toLowerCase().includes(search.toLowerCase())
      const matchCategory = !categoryFilter || categoria === categoryFilter
      return matchSearch && matchCategory
    })
  }, [stock, search, categoryFilter])

  const stats = useMemo(() => {
    let sinStock = 0, bajoMinimo = 0
    stock.forEach((s) => {
      if (s.quantity === 0) sinStock++
      else if (s.reorder_point > 0 && s.quantity < s.reorder_point) bajoMinimo++
    })
    return { total: stock.length, sinStock, bajoMinimo }
  }, [stock])

  const handleEdit = (entry: StockConProducto) => {
    setEditingEntry(entry)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingEntry(null)
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-amber-900/20 bg-white/2 px-4 py-3">
          <p className="text-xs text-gray-500">Presentaciones</p>
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
            placeholder="Buscar por producto o presentación..."
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
          {categorias.map((c) => (
            <option key={c} value={c} className="bg-[#0d1f38]">{c}</option>
          ))}
        </select>

        <button
          onClick={() => { setEditingEntry(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Agregar presentación
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-amber-900/20 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-sm text-gray-500">
              {stock.length === 0
                ? 'No hay stock registrado. Agregá la primera presentación.'
                : 'Sin resultados para la búsqueda aplicada.'}
            </p>
            {stock.length === 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30 transition-all"
              >
                Agregar primera presentación
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-900/20 bg-white/2">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Presentación</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Mínimo</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-amber-900/10 hover:bg-white/2 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{s.regional_products?.name ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {s.regional_products?.category ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-300 text-xs bg-white/5 px-2 py-0.5 rounded border border-white/8">
                        {s.presentation}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-white tabular-nums">{s.quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-gray-500 tabular-nums text-xs">{s.reorder_point}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-gray-300 tabular-nums text-sm">
                        {s.price != null ? `$${Number(s.price).toLocaleString('es-AR')}` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Semaforo quantity={s.quantity} reorder={s.reorder_point} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button
                          onClick={() => handleEdit(s)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-gray-600 text-right">
          Mostrando {filtered.length} de {stock.length} presentaciones
        </p>
      )}

      {showForm && (
        <StockEntryForm
          productos={productos}
          entry={editingEntry}
          onClose={handleCloseForm}
        />
      )}
    </div>
  )
}
