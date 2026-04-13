'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'

type Movimiento = {
  id: string
  type: 'PRODUCCION' | 'VENTA_FINDE' | 'REPOSICION_BAR' | 'RETIRO' | 'CONSUMICION'
  location: 'BAR' | 'FABRICA' | 'SAN_MIGUEL'
  quantity: number
  notes: string | null
  created_at: string
  empanada_flavors: { name: string; code: string } | null
  profiles: { full_name: string | null; email: string } | null
}

const TYPE_CONFIG = {
  PRODUCCION:     { label: 'Producción',   color: 'text-amber-400',  bg: 'bg-amber-500/10',  sign: '+' },
  VENTA_FINDE:    { label: 'Venta finde',  color: 'text-green-400',  bg: 'bg-green-500/10',  sign: '-' },
  REPOSICION_BAR: { label: 'Repos. bar',   color: 'text-blue-400',   bg: 'bg-blue-500/10',   sign: '↔' },
  RETIRO:         { label: 'Retiro',       color: 'text-purple-400', bg: 'bg-purple-500/10', sign: '-' },
  CONSUMICION:    { label: 'Consumición',  color: 'text-orange-400', bg: 'bg-orange-500/10', sign: '-' },
}

const LOC_LABEL = { BAR: '🍺 Bar', FABRICA: '🏭 Fábrica', SAN_MIGUEL: '📍 San Miguel' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export function HistorialTable({ movimientos }: { movimientos: Movimiento[] }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const filtered = useMemo(() => movimientos.filter(m => {
    const matchSearch = !search ||
      m.empanada_flavors?.name.toLowerCase().includes(search.toLowerCase()) ||
      m.notes?.toLowerCase().includes(search.toLowerCase())
    const matchType = !typeFilter || m.type === typeFilter
    return matchSearch && matchType
  }), [movimientos, search, typeFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Buscar sabor o nota..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all appearance-none min-w-44">
          <option value="" className="bg-[#0d1f38]">Todos los tipos</option>
          {Object.entries(TYPE_CONFIG).map(([val, cfg]) => (
            <option key={val} value={val} className="bg-[#0d1f38]">{cfg.label}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-amber-900/20 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-gray-500">
              {movimientos.length === 0 ? 'Sin movimientos registrados todavía.' : 'Sin resultados.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-900/20 bg-white/2">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Sabor</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cant.</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Registrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/10">
                {filtered.map(m => {
                  const cfg = TYPE_CONFIG[m.type]
                  return (
                    <tr key={m.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap tabular-nums">{formatDate(m.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white text-sm">{m.empanada_flavors?.name ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{LOC_LABEL[m.location] ?? m.location}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold tabular-nums ${cfg.color}`}>{cfg.sign}{m.quantity}</span>
                        <span className="text-xs text-gray-600 ml-0.5">bdjas</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-40 truncate">{m.notes ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{m.profiles?.full_name ?? m.profiles?.email ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {filtered.length > 0 && (
        <p className="text-xs text-gray-600 text-right">{filtered.length} de {movimientos.length} movimientos</p>
      )}
    </div>
  )
}
