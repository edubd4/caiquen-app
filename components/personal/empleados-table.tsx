'use client'

import { useState, useTransition } from 'react'
import { Plus, Edit2, Trash2, Loader2, Users, Phone } from 'lucide-react'
import { EmpleadoForm } from './empleado-form'
import { deleteEmpleado } from '@/app/actions/personal'

type Position = { id: string; name: string }

export type Empleado = {
  id: string
  full_name: string
  position_id: string
  base_salary: number
  phone: string | null
  notes: string | null
  job_positions: { name: string } | null
}

interface EmpleadosTableProps {
  empleados: Empleado[]
  positions: Position[]
}

function formatSalary(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export function EmpleadosTable({ empleados, positions }: EmpleadosTableProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return
    setDeletingId(id)
    startTransition(async () => {
      await deleteEmpleado(id)
      setDeletingId(null)
    })
  }

  return (
    <div className="space-y-4">
      {/* Header stat + botón */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Users className="w-4 h-4" />
          <span>{empleados.length} empleado{empleados.length !== 1 ? 's' : ''} activo{empleados.length !== 1 ? 's' : ''}</span>
        </div>
        <button
          onClick={() => { setEditingEmpleado(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4" />
          Nuevo empleado
        </button>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-amber-900/20 overflow-hidden">
        {empleados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-sm text-gray-500">No hay empleados registrados todavía.</p>
            <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30 transition-all">
              Agregar el primero
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-900/20 bg-white/2">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Puesto</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Sueldo base</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/10">
                {empleados.map(emp => (
                  <tr key={emp.id} className="hover:bg-white/2 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{emp.full_name}</p>
                      {emp.notes && <p className="text-xs text-gray-600 truncate max-w-48">{emp.notes}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-300">{emp.job_positions?.name ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-white tabular-nums">{formatSalary(emp.base_salary)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {emp.phone ? (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Phone className="w-3 h-3" />{emp.phone}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button onClick={() => { setEditingEmpleado(emp); setShowForm(true) }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all" title="Editar">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(emp.id, emp.full_name)} disabled={deletingId === emp.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50" title="Eliminar">
                          {deletingId === emp.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <EmpleadoForm
          positions={positions}
          empleado={editingEmpleado}
          onClose={() => { setShowForm(false); setEditingEmpleado(null) }}
        />
      )}
    </div>
  )
}
