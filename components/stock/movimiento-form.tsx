'use client'

import { useState, useTransition } from 'react'
import { X, Loader2 } from 'lucide-react'
import { registrarMovimiento } from '@/app/actions/stock'

type StockItem = { id: string; name: string; item_code: string; units: { abbreviation: string } | null }
type Location = { id: string; name: string }

interface MovimientoFormProps {
  items: StockItem[]
  locations: Location[]
  onClose: () => void
}

const MOVEMENT_TYPES = [
  { value: 'ENTRADA', label: 'Entrada', color: 'text-green-400', desc: 'Compra, recepción de mercadería' },
  { value: 'SALIDA', label: 'Salida', color: 'text-red-400', desc: 'Uso en cocina, consumo' },
  { value: 'AJUSTE', label: 'Ajuste', color: 'text-blue-400', desc: 'Corrección de inventario' },
  { value: 'MERMA', label: 'Merma', color: 'text-orange-400', desc: 'Vencimiento, rotura, pérdida' },
  { value: 'TRANSFERENCIA', label: 'Transferencia', color: 'text-purple-400', desc: 'Entre ubicaciones' },
] as const

export function MovimientoForm({ items, locations, onClose }: MovimientoFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)
  const [movType, setMovType] = useState<string>('ENTRADA')

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await registrarMovimiento(formData)
      if (result.success) {
        onClose()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0d1f38] border border-amber-900/30 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-900/20">
          <h2 className="text-base font-semibold text-white">Registrar movimiento</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form action={handleSubmit} className="p-6 space-y-4">
          {/* Tipo de movimiento */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Tipo de movimiento <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {MOVEMENT_TYPES.map((t) => (
                <label
                  key={t.value}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                    movType === t.value
                      ? 'border-amber-500/40 bg-amber-500/10'
                      : 'border-white/10 bg-white/2 hover:bg-white/5'
                  }`}
                >
                  <input
                    type="radio"
                    name="movement_type"
                    value={t.value}
                    checked={movType === t.value}
                    onChange={() => setMovType(t.value)}
                    className="hidden"
                  />
                  <div className={`w-2 h-2 rounded-full ${movType === t.value ? 'bg-amber-400' : 'bg-gray-600'}`} />
                  <span className={`text-sm font-medium ${t.color}`}>{t.label}</span>
                  <span className="text-xs text-gray-600 ml-auto">{t.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ítem */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Ítem <span className="text-red-400">*</span>
            </label>
            <select
              name="item_id"
              required
              onChange={(e) => {
                const found = items.find(i => i.id === e.target.value)
                setSelectedItem(found ?? null)
              }}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all appearance-none"
            >
              <option value="" disabled selected className="bg-[#0d1f38]">Seleccionar ítem...</option>
              {items.map((item) => (
                <option key={item.id} value={item.id} className="bg-[#0d1f38]">
                  {item.item_code} — {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Ubicación + Cantidad en fila */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Ubicación <span className="text-red-400">*</span>
              </label>
              <select
                name="location_id"
                required
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all appearance-none"
              >
                <option value="" disabled selected className="bg-[#0d1f38]">Seleccionar...</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id} className="bg-[#0d1f38]">{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Cantidad {selectedItem?.units?.abbreviation && (
                  <span className="text-amber-400/60">({selectedItem.units.abbreviation})</span>
                )} <span className="text-red-400">*</span>
              </label>
              <input
                name="quantity"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>
          </div>

          {/* Motivo/Razón */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Motivo <span className="text-gray-600">(opcional)</span>
            </label>
            <input
              name="reason"
              placeholder="Ej: Compra en Fidenza, factura 001-234"
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
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Registrando...</> : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
