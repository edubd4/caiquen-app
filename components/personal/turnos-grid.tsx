'use client'

import { useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Clock, Loader2, Plus } from 'lucide-react'
import { upsertTurno } from '@/app/actions/personal'

type Empleado = { id: string; full_name: string; job_positions: { name: string } | null }
type Shift = {
  id: string; employee_id: string; date: string
  time_in: string | null; time_out: string | null; hours_worked: number | null
}

interface TurnosGridProps {
  empleados: Empleado[]
  shifts: Shift[]
  weekDates: string[] // 7 fechas ISO: ['2026-04-07', ...]
  weekLabel: string
}

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function ShiftCell({
  shift, employeeId, date
}: { shift?: Shift; employeeId: string; date: string }) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [timeIn, setTimeIn] = useState(shift?.time_in ?? '')
  const [timeOut, setTimeOut] = useState(shift?.time_out ?? '')

  const hasShift = !!(shift?.time_in || shift?.time_out)
  const hours = shift?.hours_worked

  const handleSave = () => {
    const fd = new FormData()
    fd.set('employee_id', employeeId)
    fd.set('date', date)
    fd.set('time_in', timeIn)
    fd.set('time_out', timeOut)
    startTransition(async () => {
      await upsertTurno(fd)
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1 p-1.5 min-w-24">
        <input type="time" value={timeIn} onChange={e => setTimeIn(e.target.value)}
          className="w-full px-1.5 py-1 rounded text-xs bg-white/10 border border-white/20 text-white focus:outline-none focus:border-amber-500/50" />
        <input type="time" value={timeOut} onChange={e => setTimeOut(e.target.value)}
          className="w-full px-1.5 py-1 rounded text-xs bg-white/10 border border-white/20 text-white focus:outline-none focus:border-amber-500/50" />
        <div className="flex gap-1">
          <button onClick={handleSave} disabled={isPending}
            className="flex-1 py-0.5 rounded text-xs bg-amber-500 hover:bg-amber-400 text-black font-medium disabled:opacity-50 flex items-center justify-center">
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : '✓'}
          </button>
          <button onClick={() => setEditing(false)} className="flex-1 py-0.5 rounded text-xs bg-white/10 text-gray-400 hover:text-white">✕</button>
        </div>
      </div>
    )
  }

  if (hasShift) {
    return (
      <button onClick={() => setEditing(true)}
        className="w-full p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-center hover:bg-green-500/20 transition-all group">
        <p className="text-xs text-green-400 font-mono">
          {shift?.time_in?.slice(0, 5) ?? '—'} / {shift?.time_out?.slice(0, 5) ?? '—'}
        </p>
        {hours != null && (
          <p className="text-xs text-green-400/70 mt-0.5">{hours}h</p>
        )}
      </button>
    )
  }

  return (
    <button onClick={() => setEditing(true)}
      className="w-full p-2 rounded-lg border border-dashed border-white/10 text-center hover:border-amber-500/40 hover:bg-white/3 transition-all group opacity-0 group-hover:opacity-100">
      <Plus className="w-3 h-3 text-gray-600 mx-auto" />
    </button>
  )
}

export function TurnosGrid({ empleados, shifts, weekDates, weekLabel }: TurnosGridProps) {
  // Mapa rápido: employeeId+date → shift
  const shiftMap = new Map(
    shifts.map(s => [`${s.employee_id}|${s.date}`, s])
  )

  // Calcular total de horas por empleado en la semana
  const horasPorEmpleado = (empId: string) =>
    shifts
      .filter(s => s.employee_id === empId)
      .reduce((sum, s) => sum + (s.hours_worked ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Header de semana */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-white">{weekLabel}</span>
        </div>
        <p className="text-xs text-gray-500">Hacé click en una celda para registrar el horario</p>
      </div>

      {/* Grilla */}
      <div className="rounded-xl border border-amber-900/20 overflow-x-auto">
        <table className="w-full text-sm min-w-max">
          <thead>
            <tr className="border-b border-amber-900/20 bg-white/2">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-[#0a1628] z-10 min-w-44">
                Empleado
              </th>
              {weekDates.map((date, i) => {
                const d = new Date(date + 'T12:00:00')
                const isWeekend = d.getDay() === 0 || d.getDay() === 6
                return (
                  <th key={date} className={`text-center px-2 py-3 min-w-28 ${isWeekend ? 'bg-amber-500/5' : ''}`}>
                    <p className={`text-xs font-medium uppercase tracking-wider ${isWeekend ? 'text-amber-400/70' : 'text-gray-500'}`}>
                      {DAY_NAMES[i]}
                    </p>
                    <p className={`text-xs mt-0.5 ${isWeekend ? 'text-amber-400/50' : 'text-gray-600'}`}>
                      {d.getDate()}/{d.getMonth() + 1}
                    </p>
                  </th>
                )
              })}
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-20">
                Horas
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-900/10">
            {empleados.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-500">
                  No hay empleados activos. Agregá empleados en la pestaña "Empleados".
                </td>
              </tr>
            ) : (
              empleados.map(emp => {
                const totalHours = horasPorEmpleado(emp.id)
                return (
                  <tr key={emp.id} className="hover:bg-white/1 transition-colors group">
                    <td className="px-4 py-2 sticky left-0 bg-[#0a1628] z-10 border-r border-amber-900/10">
                      <p className="font-medium text-white text-sm">{emp.full_name}</p>
                      <p className="text-xs text-gray-600">{emp.job_positions?.name ?? '—'}</p>
                    </td>
                    {weekDates.map(date => {
                      const shift = shiftMap.get(`${emp.id}|${date}`)
                      const d = new Date(date + 'T12:00:00')
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6
                      return (
                        <td key={date} className={`px-1.5 py-1.5 ${isWeekend ? 'bg-amber-500/3' : ''}`}>
                          <ShiftCell shift={shift} employeeId={emp.id} date={date} />
                        </td>
                      )
                    })}
                    <td className="px-4 py-2 text-right">
                      <span className={`font-semibold tabular-nums text-sm ${totalHours > 0 ? 'text-amber-400' : 'text-gray-600'}`}>
                        {totalHours > 0 ? `${totalHours}h` : '—'}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600">Las horas se calculan automáticamente al registrar entrada y salida.</p>
    </div>
  )
}
