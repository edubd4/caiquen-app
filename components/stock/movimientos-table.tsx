'use client'

import { useState, useMemo } from 'react'
import { Search, ArrowDownCircle, ArrowUpCircle, RotateCcw, Trash2, ArrowLeftRight } from 'lucide-react'

type Movimiento = {
  id: string
  type: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'MERMA' | 'TRANSFERENCIA'
  quantity: number
  reason: string | null
  created_at: string
  items: { name: string; item_code: string; units: { abbreviation: string } | null } | null
  locations: { name: string } | null
  profiles: { full_name: string | null; email: string } | null
}

interface MovimientosTableProps {
  movimientos: Movimiento[]
}

const TYPE_CONFIG = {
  ENTRADA: {
    label: 'Entrada',
    icon: ArrowDownCircle,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    sign: '+',
  },
  SALIDA: {
    label: 'Salida',
    icon: ArrowUpCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    sign: '-',
  },
  AJUSTE: {
    label: 'Ajuste',
    icon: RotateCcw,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    sign: '±',
  },
  MERMA: {
    label: 'Merma',
    icon: Trash2,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    sign: '-',
  },
  TRANSFERENCIA: {
    label: 'Transferencia',
    icon: ArrowLeftRight,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    sign: '↔',
  },
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MovimientosTable({ movimientos }: MovimientosTableProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const filtered = useMemo(() => {
    return movimientos.filter((m) => {
      const matchSearch =
        !search ||
        m.items?.name.toLowerCase().includes(search.toLowerCase()) ||
        m.items?.item_code.toLowerCase().includes(search.toLowerCase()) ||
        m.reason?.toLowerCase().includes(search.toLowerCase())
      const matchType = !typeFilter || m.type === typeFilter
      return matchSearch && matchType
    })
  }, [movimientos, search, typeFilter])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por ítem, código o motivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all appearance-none min-w-44"
        >
          <option value="" className="bg-[#0d1f38]">Todos los tipos</option>
          {Object.entries(TYPE_CONFIG).map(([val, cfg]) => (
            <option key={val} value={val} className="bg-[#0d1f38]">{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-amber-900/20 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ArrowLeftRight className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-sm text-gray-500">
              {movimientos.length === 0
                ? 'No hay movimientos registrados todavía.'
                : 'Sin resultados para los filtros aplicados.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-900/20 bg-white/2">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ítem</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Registrado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/10">
                {filtered.map((mov) => {
                  const cfg = TYPE_CONFIG[mov.type]
                  const Icon = cfg.icon
                  const unit = mov.items?.units?.abbreviation ?? ''
                  return (
                    <tr key={mov.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
                          {formatDate(mov.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{mov.items?.name ?? '—'}</p>
                        <p className="text-xs text-amber-400/50 font-mono">{mov.items?.item_code}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-400 text-xs">{mov.locations?.name ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold tabular-nums ${cfg.color}`}>
                          {cfg.sign}{mov.quantity % 1 === 0 ? mov.quantity : mov.quantity.toFixed(2)}
                          {unit && <span className="text-xs font-normal ml-0.5 text-gray-500">{unit}</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-500 text-xs">{mov.reason ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600 text-xs">
                          {mov.profiles?.full_name ?? mov.profiles?.email ?? '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-gray-600 text-right">
          Mostrando {filtered.length} de {movimientos.length} movimientos
        </p>
      )}
    </div>
  )
}
