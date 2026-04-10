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
    <div className={`rounded-xl border p-5 ${status ? statusColors[status] : 'border-amber-900/20 bg-white/2'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
          {sublabel && <p className="mt-1 text-xs text-gray-600">{sublabel}</p>}
        </div>
        <div className={`p-2.5 rounded-lg bg-white/5 ${status ? iconColors[status] : 'text-amber-400'}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

function QuickAction({ label, description, href, icon: Icon }: {
  label: string; description: string; href: string; icon: React.ElementType
}) {
  return (
    <a href={href} className="flex items-center gap-4 p-4 rounded-xl border border-amber-900/20 bg-white/2 hover:bg-white/5 hover:border-amber-500/30 transition-all group">
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

export default async function InicioPage() {
  const supabase = await createClient()

  // KPIs reales desde la base de datos
  const [stockBajoRes, empanadasRes, empleadosRes, prodRes] = await Promise.all([
    supabase.from('stock_current').select('id', { count: 'exact' }).lt('quantity', supabase.from('stock_current').select('reorder_point')),
    supabase.from('empanada_stock').select('quantity').then(r => r),
    supabase.from('employees').select('id', { count: 'exact' }).is('deleted_at', null),
    supabase.from('production_logs').select('id', { count: 'exact' }).gte('created_at', new Date().toISOString().split('T')[0]),
  ])

  // Totales simples (los queries complejos vendrán con el módulo de stock activo)
  const empanadasTotal = (empanadasRes.data ?? []).reduce((sum: number, r: { quantity: number }) => sum + (r.quantity || 0), 0)
  const empleadosActivos = empleadosRes.count ?? 0
  const produccionHoy = prodRes.count ?? 0

  const now = new Date()
  const hora = now.getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div>
      <Topbar title="Dashboard" subtitle="Resumen operacional del día" />
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-white">{saludo} 👋</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <section>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Estado del sistema</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard label="Producción hoy" value={produccionHoy} sublabel="Lotes registrados" icon={Flame} />
            <KpiCard label="Empleados activos" value={empleadosActivos} sublabel="En el sistema" icon={Users} />
            <KpiCard label="Stock empanadas" value={empanadasTotal} sublabel="Unidades en total" icon={ChefHat} />
            <KpiCard label="Alertas de stock" value={0} sublabel="Items bajo mínimo" icon={AlertTriangle} status="ok" />
          </div>
        </section>

        <section>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Acciones rápidas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickAction label="Ver catálogo de stock" description="Ítems, categorías y proveedores" href="/stock" icon={Package} />
            <QuickAction label="Empanadas" description="Stock por ubicación y producción" href="/empanadas" icon={ChefHat} />
            <QuickAction label="Personal y nómina" description="Empleados, horarios y sueldos" href="/personal" icon={Users} />
            <QuickAction label="Producción" description="Recetas y lotes producidos" href="/produccion" icon={TrendingUp} />
          </div>
        </section>

        <section>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Actividad reciente</h3>
          <div className="rounded-xl border border-amber-900/20 bg-white/2 p-6">
            <div className="flex flex-col items-center justify-center text-center py-8">
              <Activity className="w-8 h-8 text-gray-600 mb-3" />
              <p className="text-sm text-gray-500">Todavía no hay actividad registrada.</p>
              <p className="text-xs text-gray-600 mt-1">Los movimientos de stock y producción aparecerán aquí.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
