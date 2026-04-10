'use client'

import { useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { MovimientoForm } from './movimiento-form'

type StockItem = { id: string; name: string; item_code: string; units: { abbreviation: string } | null }
type Location = { id: string; name: string }

interface StockActionsProps {
  items: StockItem[]
  locations: Location[]
}

export function StockActions({ items, locations }: StockActionsProps) {
  const [showMovimiento, setShowMovimiento] = useState(false)

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => setShowMovimiento(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-sm font-medium transition-all"
        >
          <ArrowUpDown className="w-4 h-4" />
          Registrar movimiento
        </button>
      </div>

      {showMovimiento && (
        <MovimientoForm
          items={items}
          locations={locations}
          onClose={() => setShowMovimiento(false)}
        />
      )}
    </>
  )
}
