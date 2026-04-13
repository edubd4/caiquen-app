'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Loader2, DollarSign, Lock, Unlock } from 'lucide-react'
import { registrarAdelanto, abrirPeriodo, cerrarPeriodo } from '@/app/actions/personal'

type PayrollRow = {
  employee_id: string | null
  full_name: string | null
  position: string | null
  base_salary: number | null
  total_hours: number | null
  earned_salary: number | null
  total_advances: number | null
  net_payable: number | null
  period_id: string | null
  week_start: string | null
  week_end: string | null
  period_status: string | null
}

type Period = {
  id: string; week_start: string; week_end: string; status: string
}

type Empleado = { id: string; full_name: string }

interface NominaViewProps {
  rows: PayrollRow[]
  currentPeriod: Period | null
  empleados: Empleado[]
}

function formatARS(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function AdelantoModal({ empleados, periodId, onClose }: { empleados: Empleado[]; periodId?: string; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(formData: FormData) {
    setError(null)
    if (periodId) formData.set('period_id', periodId)
    startTransition(async () => {
      const result = await registrarAdelanto(formData)
      if (result.success) onClose()
      else setError(result.error)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0d1f38] border border-amber-900/30 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-900/20">
          <h2 className="text-base font-semibold text-white">Registrar adelanto / retiro</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"><X className="w-4 h-4" /></button>
        </div>
        <form action={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Empleado <span className="text-red-400">*</span></label>
            <select name="employee_id" required className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 appearance-none">
              <option value="" disabled selected className="bg-[#0d1f38]">Seleccionar...</option>
              {empleados.map(e => <option key={e.id} value={e.id} className="bg-[#0d1f38]">{e.full_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Monto (ARS) <span className="text-red-400">*</span></label>
              <input name="amount" type="number" min="1" step="100" required placeholder="0"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Fecha <span className="text-red-400">*</span></label>
              <input name="date" type="date" defaultValue={today} required
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Motivo <span className="text-gray-600">(opcional)</span></label>
            <input name="reason" placeholder="Ej: Adelanto quincena, retiro efectivo..."
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all" />
          </div>
          {error && <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all">Cancelar</button>
            <button type="submit" disabled={isPending} className="flex-1 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black text-sm font-semibold flex items-center justify-center gap-2">
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />...</> : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function NominaView({ rows, currentPeriod, empleados }: NominaViewProps) {
  const [showAdelanto, setShowAdelanto] = useState(false)
  const [showNuevoPeriodo, setShowNuevoPeriodo] = useState(false)
  const [isPending, startTransition] = useTransition()

  const totalNeto = rows.reduce((sum, r) => sum + (r.net_payable ?? 0), 0)
  const totalHoras = rows.reduce((sum, r) => sum + (r.total_hours ?? 0), 0)

  const handleCerrar = () => {
    if (!currentPeriod) return
    if (!confirm('¿Cerrar este período? No se podrán agregar más turnos.')) return
    startTransition(async () => { await cerrarPeriodo(currentPeriod.id) })
  }

  return (
    <div className="space-y-5">
      {/* Período actual */}
      {currentPeriod ? (
        <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Período abierto</p>
            <p className="text-white font-medium mt-0.5">
              {formatDate(currentPeriod.week_start)} → {formatDate(currentPeriod.week_end)}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdelanto(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-all">
              <Plus className="w-3.5 h-3.5" /> Adelanto
            </button>
            <button onClick={handleCerrar} disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-gray-400 text-xs font-medium hover:text-white hover:bg-white/5 transition-all disabled:opacity-50">
              <Lock className="w-3.5 h-3.5" /> Cerrar período
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/2">
          <div>
            <p className="text-sm text-gray-400">No hay período abierto.</p>
            <p className="text-xs text-gray-600 mt-0.5">Abrí uno para empezar a registrar sueldos.</p>
          </div>
          <button onClick={() => setShowNuevoPeriodo(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-all">
            <Unlock className="w-3.5 h-3.5" /> Abrir período
          </button>
        </div>
      )}

      {/* KPIs */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-amber-900/20 bg-white/2 px-4 py-3">
            <p className="text-xs text-gray-500">Total horas</p>
            <p className="text-xl font-bold text-white mt-0.5">{totalHoras}h</p>
          </div>
          <div className="rounded-xl border border-amber-900/20 bg-white/2 px-4 py-3">
            <p className="text-xs text-gray-500">Empleados</p>
            <p className="text-xl font-bold text-white mt-0.5">{rows.length}</p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <p className="text-xs text-gray-500">Total a pagar</p>
            <p className="text-xl font-bold text-amber-400 mt-0.5">{formatARS(totalNeto)}</p>
          </div>
        </div>
      )}

      {/* Tabla de nómina */}
      <div className="rounded-xl border border-amber-900/20 overflow-hidden">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <DollarSign className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-sm text-gray-500">
              {currentPeriod
                ? 'Registrá turnos en la pestaña Turnos para calcular la nómina.'
                : 'Abrí un período para ver la nómina.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-900/20 bg-white/2">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Puesto</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Horas</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Sueldo ganado</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Adelantos</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">A cobrar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/10">
                {rows.map(row => (
                  <tr key={row.employee_id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{row.full_name}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{row.position ?? '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-300">{row.total_hours ?? 0}h</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-300">{formatARS(row.earned_salary)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-red-400">
                      {(row.total_advances ?? 0) > 0 ? `- ${formatARS(row.total_advances)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-amber-400 tabular-nums">{formatARS(row.net_payable)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-amber-900/30 bg-white/3">
                  <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Total</td>
                  <td colSpan={2} />
                  <td className="px-4 py-3 text-right font-bold text-amber-400 tabular-nums">{formatARS(totalNeto)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal adelanto */}
      {showAdelanto && (
        <AdelantoModal empleados={empleados} periodId={currentPeriod?.id} onClose={() => setShowAdelanto(false)} />
      )}

      {/* Modal nuevo período */}
      {showNuevoPeriodo && (
        <NuevoPeriodoModal onClose={() => setShowNuevoPeriodo(false)} />
      )}
    </div>
  )
}

function NuevoPeriodoModal({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Calcular semana actual (lunes a domingo)
  const today = new Date()
  const day = today.getDay() // 0=dom
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const toISO = (d: Date) => d.toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const start = fd.get('week_start') as string
    const end = fd.get('week_end') as string
    startTransition(async () => {
      const result = await abrirPeriodo(start, end)
      if (result.success) onClose()
      else setError(result.error)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0d1f38] border border-amber-900/30 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-900/20">
          <h2 className="text-base font-semibold text-white">Abrir período de nómina</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Desde <span className="text-red-400">*</span></label>
              <input name="week_start" type="date" defaultValue={toISO(monday)} required
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Hasta <span className="text-red-400">*</span></label>
              <input name="week_end" type="date" defaultValue={toISO(sunday)} required
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50" />
            </div>
          </div>
          {error && <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all">Cancelar</button>
            <button type="submit" disabled={isPending} className="flex-1 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black text-sm font-semibold flex items-center justify-center gap-2">
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />...</> : 'Abrir período'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
