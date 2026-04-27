import { Topbar } from '@/components/layout/topbar'
import { createClient } from '@/lib/supabase/server'
import { ConfigForm } from '@/components/configuracion/config-form'
import { UsersTable } from '@/components/configuracion/users-table'

export const revalidate = 0

type AppConfig = { key: string; value: string; description: string | null }
type Profile = { id: string; email: string; full_name: string | null; role: string; created_at: string }

export default async function ConfiguracionPage() {
  const supabase = await createClient()

  const [configRes, profilesRes] = await Promise.all([
    supabase.from('app_config').select('key, value, description').order('key'),
    supabase.from('profiles').select('id, email, full_name, role, created_at').order('role').order('full_name'),
  ])

  const config = (configRes.data ?? []) as AppConfig[]
  const profiles = (profilesRes.data ?? []) as Profile[]

  // Agrupar config en secciones para la UI
  const restaurante = config.filter((c) =>
    ['restaurant_name', 'currency', 'timezone'].includes(c.key)
  )
  const nomina = config.filter((c) => ['payroll_week_start'].includes(c.key))
  const alertas = config.filter((c) => ['stock_alert_telegram'].includes(c.key))

  return (
    <div>
      <Topbar title="Configuración" subtitle="Parámetros del sistema — solo administradores" />

      <div className="p-6 space-y-8 max-w-3xl">

        {/* ── Restaurante ── */}
        <section>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
            Datos del restaurante
          </h2>
          <div className="rounded-xl border border-amber-900/20 bg-[#0a1628] divide-y divide-amber-900/10">
            {restaurante.map((item) => (
              <ConfigForm key={item.key} item={item} />
            ))}
          </div>
        </section>

        {/* ── Nómina ── */}
        <section>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
            Configuración de nómina
          </h2>
          <div className="rounded-xl border border-amber-900/20 bg-[#0a1628] divide-y divide-amber-900/10">
            {nomina.map((item) => (
              <ConfigForm key={item.key} item={item} />
            ))}
          </div>
        </section>

        {/* ── Alertas ── */}
        <section>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
            Alertas
          </h2>
          <div className="rounded-xl border border-amber-900/20 bg-[#0a1628] divide-y divide-amber-900/10">
            {alertas.map((item) => (
              <ConfigForm key={item.key} item={item} />
            ))}
          </div>
        </section>

        {/* ── Usuarios ── */}
        <section>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
            Usuarios del sistema
          </h2>
          <UsersTable profiles={profiles} />
        </section>

      </div>
    </div>
  )
}
