'use client'

import { useState } from 'react'
import { History, Search } from 'lucide-react'

type LogRow = {
  id: string
  recipe_id: string
  qty_produced: number
  location_id: string | null
  production_date: string
  actual_yield: number | null
  yield_notes: string | null
  status: string
  created_at: string
  recipes: { name: string } | null
  locations: { name: string } | null
}

interface ProduccionLogsTableProps {
  logs: LogRow[]
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  COMPLETADO: { label: 'Completado', cls: 'bg-green-500/15 text-green-400' },
  PARCIAL: { label: 'Parcial', cls: 'bg-amber-500/15 text-amber-400' },
  FALLIDO: { label: 'Fallido', cls: 'bg-red-500/15 text-red-400' },
}

export function ProduccionLogsTable({ logs }: ProduccionLogsTableProps) {
  const [search, setSearch] = useState('')

  const filtered = logs.filter(l =>
    !search ||
    l.recipes?.name.toLowerCase().includes(search.toLowerCase()) ||
    l.locations?.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por receta o ubicación..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-amber-900/20 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <History className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-sm text-gray-500">
              {search ? 'Sin resultados para esa búsqueda.' : 'No hay registros de producción todavía.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-900/20 bg-white/2">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Receta</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cant. prod.</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rdto. real</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/10">
                {filtered.map(log => {
                  const statusCfg = STATUS_CONFIG[log.status] ?? { label: log.status, cls: 'bg-white/5 text-gray-400' }
                  return (
                    <tr key={log.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 tabular-nums text-gray-400">
                        {formatDate(log.production_date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-white">{log.recipes?.name ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="font-medium text-amber-400">{log.qty_produced}</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-400">
                        {log.actual_yield != null ? log.actual_yield : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {log.locations?.name ?? <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.cls}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-48 truncate">
                        {log.yield_notes ?? <span className="text-gray-700">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-600">
        Mostrando {filtered.length} de {logs.length} registros.
      </p>
    </div>
  )
}
