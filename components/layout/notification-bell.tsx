'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, AlertTriangle, CheckCircle, X } from 'lucide-react'

export type StockAlert = {
  item_name: string
  quantity: number
  reorder_point: number
  location_name: string
}

interface NotificationBellProps {
  alerts: StockAlert[]
}

export function NotificationBell({ alerts }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Cerrar al click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const count = alerts.length

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        title={count > 0 ? `${count} alertas de stock` : 'Sin alertas'}
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-0.5">
            {count > 9 ? '9+' : count}
          </span>
        )}
        {count === 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-amber-900/30 bg-[#0d1f38] shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-amber-900/20">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <p className="text-sm font-semibold text-white">Alertas de stock</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {count === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                <p className="text-sm font-medium text-white">Todo en orden</p>
                <p className="text-xs text-gray-500 mt-1">
                  No hay ítems por debajo del mínimo.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-amber-900/10">
                {alerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-white/3 transition-colors">
                    <div className="mt-0.5 flex-shrink-0">
                      {alert.quantity === 0
                        ? <span className="w-2 h-2 block rounded-full bg-red-500 mt-1.5" />
                        : <AlertTriangle className="w-4 h-4 text-amber-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{alert.item_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {alert.location_name} · Stock:{' '}
                        <span className={alert.quantity === 0 ? 'text-red-400' : 'text-amber-400'}>
                          {alert.quantity}
                        </span>
                        {' '}/ Mínimo: {alert.reorder_point}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {count > 0 && (
            <div className="px-4 py-2.5 border-t border-amber-900/20 bg-white/2">
              <a
                href="/stock"
                onClick={() => setOpen(false)}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                Ver catálogo de stock →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
