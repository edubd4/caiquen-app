'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Loader2, FlaskConical } from 'lucide-react'
import { checkFactibilidad } from '@/app/actions/produccion'

type FeasibilityRow = {
  item_id: string
  item_name: string
  required_qty: number
  available_qty: number
  missing_qty: number
  unit_abbr: string
}

type Location = { id: string; name: string }

interface FactibilidadCheckerProps {
  recipeId: string
  locations: Location[]
}

export function FactibilidadChecker({ recipeId, locations }: FactibilidadCheckerProps) {
  const [rows, setRows] = useState<FeasibilityRow[] | null>(null)
  const [qty, setQty] = useState('1')
  const [locationId, setLocationId] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleCheck = () => {
    const qtyNum = parseFloat(qty)
    if (!qtyNum || qtyNum <= 0) return
    setError(null)
    startTransition(async () => {
      const result = await checkFactibilidad(recipeId, qtyNum, locationId || undefined)
      if (result.success) setRows(result.data ?? [])
      else setError(result.error)
    })
  }

  const missing = rows?.filter(r => r.missing_qty > 0) ?? []
  const isFeasible = rows !== null && missing.length === 0

  return (
    <div className="space-y-3 pt-1">
      <p className="text-xs font-medium text-gray-400">Verificar factibilidad</p>

      {/* Controls */}
      <div className="flex gap-2 items-end flex-wrap">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Cantidad a producir</label>
          <input
            type="number"
            min="1"
            step="1"
            value={qty}
            onChange={e => setQty(e.target.value)}
            className="w-24 px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500/50 transition-all"
          />
        </div>
        {locations.length > 0 && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">Ubicación (opcional)</label>
            <select
              value={locationId}
              onChange={e => setLocationId(e.target.value)}
              className="w-40 px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500/50 appearance-none"
            >
              <option value="" className="bg-[#0d1f38]">Todas</option>
              {locations.map(l => (
                <option key={l.id} value={l.id} className="bg-[#0d1f38]">{l.name}</option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={handleCheck}
          disabled={isPending}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-amber-500/40 hover:bg-amber-500/5 text-amber-400 text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
          Verificar
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>
      )}

      {/* Results */}
      {rows !== null && (
        <div className="space-y-2">
          {/* Summary badge */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${
            isFeasible
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {isFeasible
              ? <><CheckCircle2 className="w-3.5 h-3.5" /> Stock suficiente para producir {qty} unidades</>
              : <><XCircle className="w-3.5 h-3.5" /> Faltan {missing.length} ingrediente{missing.length !== 1 ? 's' : ''} para producir {qty} unidades</>
            }
          </div>

          {rows.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              Esta receta no tiene ingredientes cargados en el BOM.
            </div>
          )}

          {rows.length > 0 && (
            <div className="rounded-lg border border-amber-900/20 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-amber-900/20 bg-white/2">
                    <th className="text-left px-3 py-1.5 text-gray-500 font-medium">Ingrediente</th>
                    <th className="text-right px-3 py-1.5 text-gray-500 font-medium">Necesario</th>
                    <th className="text-right px-3 py-1.5 text-gray-500 font-medium">Disponible</th>
                    <th className="text-right px-3 py-1.5 text-gray-500 font-medium">Faltante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10">
                  {rows.map(row => {
                    const ok = row.missing_qty <= 0
                    return (
                      <tr key={row.item_id} className={ok ? '' : 'bg-red-500/5'}>
                        <td className="px-3 py-1.5 flex items-center gap-1.5">
                          {ok
                            ? <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                            : <XCircle className="w-3 h-3 text-red-400 shrink-0" />}
                          <span className={ok ? 'text-gray-300' : 'text-red-300'}>{row.item_name}</span>
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-gray-400">
                          {row.required_qty} {row.unit_abbr}
                        </td>
                        <td className={`px-3 py-1.5 text-right tabular-nums ${ok ? 'text-green-400' : 'text-red-400'}`}>
                          {row.available_qty} {row.unit_abbr}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          {row.missing_qty > 0
                            ? <span className="text-red-400 font-medium">−{row.missing_qty} {row.unit_abbr}</span>
                            : <span className="text-gray-600">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
