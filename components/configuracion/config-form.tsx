'use client'

import { useTransition, useState, useRef } from 'react'
import { Loader2, Check, Edit2 } from 'lucide-react'
import { updateAppConfig } from '@/app/actions/config'

type ConfigItem = { key: string; value: string; description: string | null }

const FIELD_LABELS: Record<string, string> = {
  restaurant_name: 'Nombre del restaurante',
  currency: 'Moneda',
  timezone: 'Zona horaria',
  payroll_week_start: 'Inicio de semana laboral',
  stock_alert_telegram: 'Alertas por Telegram',
}

const FIELD_TYPES: Record<string, 'text' | 'select' | 'toggle'> = {
  restaurant_name: 'text',
  currency: 'select',
  timezone: 'select',
  payroll_week_start: 'select',
  stock_alert_telegram: 'toggle',
}

const SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  currency: [
    { value: 'ARS', label: 'ARS — Peso argentino' },
    { value: 'USD', label: 'USD — Dólar' },
  ],
  timezone: [
    { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
    { value: 'America/Argentina/Cordoba', label: 'Córdoba (GMT-3)' },
    { value: 'America/Argentina/Mendoza', label: 'Mendoza (GMT-3)' },
  ],
  payroll_week_start: [
    { value: 'monday', label: 'Lunes' },
    { value: 'sunday', label: 'Domingo' },
    { value: 'saturday', label: 'Sábado' },
  ],
}

export function ConfigForm({ item }: { item: ConfigItem }) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const type = FIELD_TYPES[item.key] ?? 'text'
  const label = FIELD_LABELS[item.key] ?? item.key

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await updateAppConfig(formData)
      if (result.success) {
        setSaved(true)
        setEditing(false)
        setTimeout(() => setSaved(false), 2000)
      } else {
        setError(result.error)
      }
    })
  }

  // Toggle inmediato (sin botón guardar)
  async function handleToggle(checked: boolean) {
    const fd = new FormData()
    fd.set('key', item.key)
    fd.set('value', checked ? 'true' : 'false')
    startTransition(async () => {
      const result = await updateAppConfig(fd)
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        setError(result.error)
      }
    })
  }

  if (type === 'toggle') {
    const isOn = item.value === 'true'
    return (
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          {item.description && (
            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {saved && <Check className="w-4 h-4 text-green-400" />}
          {isPending
            ? <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            : (
              <button
                type="button"
                role="switch"
                aria-checked={isOn}
                onClick={() => handleToggle(!isOn)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  isOn ? 'bg-amber-500' : 'bg-white/10'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isOn ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            )
          }
        </div>
      </div>
    )
  }

  return (
    <form ref={formRef} action={handleSubmit}>
      <input type="hidden" name="key" value={item.key} />
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
          {editing ? (
            type === 'select' ? (
              <select
                name="value"
                defaultValue={item.value}
                autoFocus
                className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-amber-500/40 text-white text-sm focus:outline-none appearance-none"
              >
                {(SELECT_OPTIONS[item.key] ?? []).map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0d1f38]">
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name="value"
                defaultValue={item.value}
                autoFocus
                className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-amber-500/40 text-white text-sm focus:outline-none"
              />
            )
          ) : (
            <p className="text-sm text-white font-medium">{item.value}</p>
          )}
          {item.description && !editing && (
            <p className="text-xs text-gray-600 mt-0.5">{item.description}</p>
          )}
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {saved && !editing && <Check className="w-4 h-4 text-green-400" />}
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => { setEditing(false); setError(null) }}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black text-xs font-semibold transition-all"
              >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Guardar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
              title="Editar"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
