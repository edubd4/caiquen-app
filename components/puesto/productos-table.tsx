'use client'

import { useState, useMemo, useTransition } from 'react'
import { Plus, Search, Edit2, Trash2, ShoppingBasket, Loader2 } from 'lucide-react'
import { ProductoForm, type Producto } from './producto-form'
import { deleteProducto } from '@/app/actions/puesto'

interface ProductosTableProps {
  productos: Producto[]
}

export function ProductosTable({ productos }: ProductosTableProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const categorias = useMemo(() => {
    const set = new Set(productos.map((p) => p.category))
    return Array.from(set).sort()
  }, [productos])

  const filtered = useMemo(() => {
    return productos.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase())
      const matchCategory = !categoryFilter || p.category === categoryFilter
      return matchSearch && matchCategory
    })
  }, [productos, search, categoryFilter])

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return
    setDeletingId(id)
    startTransition(async () => {
      await deleteProducto(id)
      setDeletingId(null)
    })
  }

  const handleEdit = (producto: Producto) => {
    setEditingProducto(producto)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingProducto(null)
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-amber-900/20 bg-white/2 px-4 py-3">
          <p className="text-xs text-gray-500">Total productos</p>
          <p className="text-xl font-bold text-white mt-0.5">{productos.length}</p>
        </div>
        <div className="rounded-xl border border-amber-900/20 bg-white/2 px-4 py-3">
          <p className="text-xs text-gray-500">Categorías</p>
          <p className="text-xl font-bold text-white mt-0.5">{categorias.length}</p>
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
          {categorias.map((c) => (
            <option key={c} value={c} className="bg-[#0d1f38]">{c}</option>
          ))}
        </select>

        <button
          onClick={() => { setEditingProducto(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Nuevo producto
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-amber-900/20 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBasket className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-sm text-gray-500">
              {productos.length === 0
                ? 'No hay productos registrados. Agregá el primero.'
                : 'Sin resultados para la búsqueda aplicada.'}
            </p>
            {productos.length === 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30 transition-all"
              >
                Crear el primer producto
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
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((producto) => (
                  <tr
                    key={producto.id}
                    className="border-b border-amber-900/10 hover:bg-white/2 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-amber-400/70">{producto.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{producto.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {producto.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-500 text-xs truncate max-w-48 block">
                        {producto.notes ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button
                          onClick={() => handleEdit(producto)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(producto.id, producto.name)}
                          disabled={deletingId === producto.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                          title="Eliminar"
                        >
                          {deletingId === producto.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
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
          Mostrando {filtered.length} de {productos.length} productos
        </p>
      )}

      {showForm && (
        <ProductoForm
          producto={editingProducto}
          onClose={handleCloseForm}
        />
      )}
    </div>
  )
}
