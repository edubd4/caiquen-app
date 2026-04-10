import { Topbar } from '@/components/layout/topbar'
import { createClient } from '@/lib/supabase/server'
import {
  Package,
  ChefHat,
  Users,
  Flame,
  AlertTriangle,
  TrendingUp,
  Activity,
} from 'lucide-react'

// KPI Card component
function KpiCard({
  label,
  value,
  sublabel,
  icon: Icon,
  status,
}: {
  label: string
  value: string | number
  sublabel?: string
  icon: React.ElementType
  status?: 'ok' | 'warning' | 'critical'
}) {
  const statusColors = {
    ok: 'border-green-500/20 bg-green-500/5',
    warning: 'border-amber-500/20 bg-amber-500/5',
    critical: 'border-red-500/20 bg-red-500/5',
  }

  const iconColors = {
    ok: 'text-green-400',
    warning: 'text-amber-400',
    critical: 'text-red-400',
  }

  return (
    <div
      className={`rounded-xl border p-5 ${
        status ? statusColors[status] : 'border-amber-900/20 bg-white/2'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
          {sublabel && <p className="mt-1 text-xs text-gray-600">{sublabel}</p>}
        </div>
        <div
          className={`p-2.5 rounded-lg bg-white/5 ${
            status ? iconColors[status] : 'text-amber-400'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

// Quick action button
function QuickAction({
  label,
  description,
  href,
  icon: Icon,
}: {
  label: string
  description: string
  href: string
  icon: React.ElementType
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-4 p-4 rounded-xl border border-amber-900/20 bg-white/2 hover:bg-white/5 hover:border-amber-500/30 transition-all group"
    >
      <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </a>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Obtener datos básicos para los KPIs
  // (cuando las tablas estén creadas, estos queries se activarán)
  const stockBajoMinimo = 0    // TODO: query stock_current donde quantity <= reorder_point
  const produccionHoy = 0     // TODO: query production_logs de hoy
  const empleadosActivos = 0  // TODO: query shifts de hoy
  const empanadasStock = 0    // TODO: query empanada_stock total

  const now = new Date()
  const hora = now.getHours()
  const saludo =
    hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div>
      <Topbar
        title="Dashboard"
        subtitle="Resumen operacional del día"
      />

      <div className="p-6 space-y-6">
        {/* Saludo */}
        <div>
          <h2 className="text-xl font-semibold text-white">
            {saludo} 👋
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {now.toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* KPIs */}
        <section>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Estado del sistema
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              label="Items bajo mínimo"
              value={stockBajoMinimo}
              sublabel="Requieren reposición"
              icon={AlertTriangle}
              status={stockBajoMinimo > 0 ? 'critical' : 'ok'}
            />
            <KpiCard
              label="Producción hoy"
              value={produccionHoy}
              sublabel="Lotes registrados"
              icon={Flame}
            />
            <KpiCard
              label="Empleados activos"
              value={empleadosActivos}
              sublabel="Con registro de entrada"
              icon={Users}
            />
            <KpiCard
              label="Stock empanadas"
              value={empanadasStock}
              sublabel="Bandejas en total"
              icon={ChefHat}
            />
          </div>
        </section>

        {/* Acciones rápidas */}
        <section>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Acciones rápidas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickAction
              label="Registrar movimiento de stock"
              description="Entrada, salida, ajuste o merma"
              href="/stock/movimientos/nuevo"
              icon={Package}
            />
            <QuickAction
              label="Registrar producción de empanadas"
              description="Por sabor y ubicación"
              href="/empanadas/produccion/nueva"
              icon={ChefHat}
            />
            <QuickAction
              label="Ver nómina semanal"
              description="Horas y sueldos del período"
              href="/personal/nomina"
              icon={Users}
            />
            <QuickAction
              label="Ver resumen de stock"
              description="Catálogo con estado actual"
              href="/stock"
              icon={TrendingUp}
            />
          </div>
        </section>

        {/* Actividad reciente */}
        <section>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Actividad reciente
          </h3>
          <div className="rounded-xl border border-amber-900/20 bg-white/2 p-6">
            <div className="flex flex-col items-center justify-center text-center py-8">
              <Activity className="w-8 h-8 text-gray-600 mb-3" />
              <p className="text-sm text-gray-500">
                Todavía no hay actividad registrada.
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Los movimientos de stock y producción aparecerán aquí.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
