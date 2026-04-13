import { Topbar } from '@/components/layout/topbar'
import { createClient } from '@/lib/supabase/server'
import { EmpleadosTable } from '@/components/personal/empleados-table'
import { TurnosGrid } from '@/components/personal/turnos-grid'
import { NominaView } from '@/components/personal/nomina-view'
import { TabsNav } from '@/components/ui/tabs-nav'
import { Suspense } from 'react'
import type { Empleado } from '@/components/personal/empleados-table'

export const revalidate = 0

interface PersonalPageProps {
  searchParams: Promise<{ tab?: string; semana?: string }>
}

// Genera los 7 días de la semana a partir del lunes
function getWeekDates(mondayISO?: string): string[] {
  const monday = mondayISO
    ? new Date(mondayISO + 'T12:00:00')
    : (() => {
        const today = new Date()
        const day = today.getDay()
        const diff = day === 0 ? -6 : 1 - day
        const d = new Date(today)
        d.setDate(today.getDate() + diff)
        return d
      })()

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

function weekLabel(dates: string[]) {
  const [start, end] = [dates[0], dates[6]]
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }
  return `Semana del ${fmt(start)} al ${fmt(end)}`
}

export default async function PersonalPage({ searchParams }: PersonalPageProps) {
  const supabase = await createClient()
  const { tab, semana } = await searchParams
  const activeTab = ['empleados', 'turnos', 'nomina'].includes(tab ?? '') ? tab! : 'empleados'

  const weekDates = getWeekDates(semana)

  // Siempre necesarios
  const [empleadosRes, positionsRes] = await Promise.all([
    supabase
      .from('employees')
      .select('id, full_name, position_id, base_salary, phone, notes, job_positions ( name )')
      .is('deleted_at', null)
      .order('full_name'),
    supabase.from('job_positions').select('id, name').order('name'),
  ])

  const empleados = (empleadosRes.data ?? []) as unknown as Empleado[]
  const positions = positionsRes.data ?? []

  // Turnos de la semana
  let shifts: Parameters<typeof TurnosGrid>[0]['shifts'] = []
  if (activeTab === 'turnos') {
    const { data } = await supabase
      .from('shifts')
      .select('id, employee_id, date, time_in, time_out, hours_worked')
      .gte('date', weekDates[0])
      .lte('date', weekDates[6])
    shifts = (data ?? []) as typeof shifts
  }

  // Nómina
  let nominaRows: Parameters<typeof NominaView>[0]['rows'] = []
  let currentPeriod: Parameters<typeof NominaView>[0]['currentPeriod'] = null
  if (activeTab === 'nomina') {
    const { data: periods } = await supabase
      .from('payroll_periods')
      .select('id, week_start, week_end, status')
      .eq('status', 'abierto')
      .order('week_start', { ascending: false })
      .limit(1)

    currentPeriod = periods?.[0] ?? null

    if (currentPeriod) {
      const { data } = await supabase
        .from('v_payroll_summary')
        .select('*')
        .eq('period_id', currentPeriod.id)
      nominaRows = (data ?? []) as typeof nominaRows
    }
  }

  const tabs = [
    { label: 'Empleados', value: 'empleados', count: empleados.length },
    { label: 'Turnos', value: 'turnos' },
    { label: 'Nómina', value: 'nomina' },
  ]

  return (
    <div>
      <Topbar title="Personal" subtitle="Empleados, horarios y nómina semanal" />

      <div className="p-6 space-y-5">
        <Suspense>
          <TabsNav tabs={tabs} />
        </Suspense>

        {activeTab === 'empleados' && (
          <EmpleadosTable empleados={empleados} positions={positions} />
        )}

        {activeTab === 'turnos' && (
          <TurnosGrid
            empleados={empleados.map(e => ({
              id: e.id,
              full_name: e.full_name,
              job_positions: e.job_positions,
            }))}
            shifts={shifts}
            weekDates={weekDates}
            weekLabel={weekLabel(weekDates)}
          />
        )}

        {activeTab === 'nomina' && (
          <NominaView
            rows={nominaRows}
            currentPeriod={currentPeriod}
            empleados={empleados.map(e => ({ id: e.id, full_name: e.full_name }))}
          />
        )}
      </div>
    </div>
  )
}
