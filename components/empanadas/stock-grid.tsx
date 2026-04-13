'use client'

import { useState } from 'react'
import { ChefHat } from 'lucide-react'
import { ProduccionForm } from './produccion-form'
import { MovimientoForm } from './movimiento-form'

type Flavor = { id: string; name: string; code: string }

type StockCell = {
  location: 'BAR' | 'FABRICA' | 'SAN_MIGUEL'
  quantity: number
  sabor_code: string
}

interface StockGridProps {
  flavors: Flavor[]
  stock: StockCell[]
}

const LOCATIONS = [
  { key: 'FABRICA' as const, label: 'Fábrica', emoji: '🏭' },
  { key: 'BAR' as const, label: 'Bar', emoji: '🍺' },
  { key: 'SAN_MIGUEL' as const, label: 'San Miguel', emoji: '📍' },
]

function QuantityCell({ qty }: { qty: number }) {
  const color =
    qty === 0
      ? 'text-red-400 bg-red-500/10 border-red-500/20'
      : qty <= 2
        ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
        : 'text-green-400 bg-green-500/10 border-green-500/20'

  return (
    <div className={`rounded-lg border px-3 py-2.5 text-center ${color}`}>
      <p className="text-xl font-bold tabular-nums leading-none">{qty}</p>
      <p className="text-xs mt-0.5 opacity-70">bdjas</p>
    </div>
  )
}

export function StockGrid({ flavors, stock }: StockGridProps) {
  const [showProduccion, setShowProduccion] = useState(false)
  const [showMovimiento, setShowMovimiento] = useState(false)

  // Obtener cantidad por sabor+ubicación
  const getQty = (saborCode: string, location: string) => {
    const cell = stock.find(s => s.sabor_code === saborCode && s.location === location)
    return cell?.quantity ?? 0
  }

  // Totales por ubicación
  const totalPorUbicacion = LOCATIONS.reduce((acc, loc) => {
    acc[loc.key] = stock
      .filter(s => s.location === loc.key)
      .reduce((sum, s) => sum + s.quantity, 0)
    return acc
  }, {} as Record<string, number>)

  const totalGeneral = Object.values(totalPorUbicacion).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-5">
      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-amber-900/20 bg-white/2 px-4 py-3">
          <p className="text-xs text-gray-500">Total general</p>
          <p className="text-2xl font-bold text-white mt-0.5">{totalGeneral}</p>
          <p className="text-xs text-gray-600">bandejas</p>
        </div>
        {LOCATIONS.map(loc => (
          <div key={loc.key} className="rounded-xl border border-amber-900/20 bg-white/2 px-4 py-3">
            <p className="text-xs text-gray-500">{loc.emoji} {loc.label}</p>
            <p className="text-2xl font-bold text-white mt-0.5">{totalPorUbicacion[loc.key]}</p>
            <p className="text-xs text-gray-600">bandejas</p>
          </div>
        ))}
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowProduccion(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-all"
        >
          <ChefHat className="w-4 h-4" />
          Registrar producción
        </button>
        <button
          onClick={() => setShowMovimiento(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-sm font-medium transition-all"
        >
          Registrar movimiento
        </button>
      </div>

      {/* Grid principal: sabores × ubicaciones */}
      <div className="rounded-xl border border-amber-900/20 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-4 border-b border-amber-900/20 bg-white/2">
          <div className="px-4 py-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sabor</span>
          </div>
          {LOCATIONS.map(loc => (
            <div key={loc.key} className="px-3 py-3 text-center">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{loc.emoji} {loc.label}</p>
            </div>
          ))}
        </div>

        {/* Filas por sabor */}
        <div className="divide-y divide-amber-900/10">
          {flavors.map((flavor, idx) => {
            const rowTotal = LOCATIONS.reduce((sum, loc) => sum + getQty(flavor.code, loc.key), 0)
            return (
              <div
                key={flavor.id}
                className={`grid grid-cols-4 items-center hover:bg-white/2 transition-colors ${idx % 2 === 0 ? '' : 'bg-white/1'}`}
              >
                {/* Sabor */}
                <div className="px-4 py-3">
                  <p className="font-medium text-white text-sm">{flavor.name}</p>
                  <p className="text-xs text-gray-600 font-mono">{flavor.code}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Total: <span className="text-gray-400 font-medium">{rowTotal}</span>
                  </p>
                </div>

                {/* Cantidad por ubicación */}
                {LOCATIONS.map(loc => (
                  <div key={loc.key} className="px-3 py-3">
                    <QuantityCell qty={getQty(flavor.code, loc.key)} />
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* Fila de totales */}
        <div className="grid grid-cols-4 items-center border-t border-amber-900/30 bg-white/3">
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</p>
          </div>
          {LOCATIONS.map(loc => (
            <div key={loc.key} className="px-3 py-3 text-center">
              <p className="text-lg font-bold text-amber-400 tabular-nums">{totalPorUbicacion[loc.key]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-green-500/30 border border-green-500/50" /> OK (&gt;2 bandejas)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/30 border border-amber-500/50" /> Bajo (1-2 bandejas)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-500/30 border border-red-500/50" /> Sin stock (0)
        </span>
      </div>

      {/* Modales */}
      {showProduccion && (
        <ProduccionForm flavors={flavors} onClose={() => setShowProduccion(false)} />
      )}
      {showMovimiento && (
        <MovimientoForm flavors={flavors} onClose={() => setShowMovimiento(false)} />
      )}
    </div>
  )
}
