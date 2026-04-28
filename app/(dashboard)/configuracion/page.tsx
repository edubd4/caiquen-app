import { Topbar } from '@/components/layout/topbar'
import { createClient } from '@/lib/supabase/server'
import { ConfigForm } from '@/components/configuracion/config-form'
import { UsersTable } from '@/components/configuracion/users-table'
import { AlertTriangle } from 'lucide-react'

export const revalidate = 0

type AppConfig = { key: string; value: string; description: string | null }
type Profile = { id: string; email: string; full_name: string | null; role: string; created_at: string }

function EmptySection({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-amber-900/20 bg-[#0a1628] px-5 py-8 text-center">
      <AlertTriangle className="w-5 h-5 text-amber-500/50 mx-auto mb-2" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}

export default async function ConfiguracionPage() {
  const supabase = await createClient()

  const [configRes, profilesRes] = await Promise.all([
    supabase.from('app_config').select('key, value, description').order('key'),
    supabase.from('profiles').select('id, email, full_name, role, created_at').order('role').order('full_name'),
  ])

  const config = (configRes.data ?? []) as AppConfig[]
  const profiles = (profilesRes.data ?? []) as Profile[]

  const restaurante = config.filter((c) =>
    ['restaurant_name', 'currency', 'timezone'].includes(c.key)
  )
  const nomina = config.filter((c) => ['payroll_week_start'].includes(c.key))
  const alertas = config.filter((c) => ['stock_alert_telegram'].includes(c.key))

  const hasConfigError = !!configRes.error
  const hasProfilesError = !!profilesRes.error

  return (
    <div>
      <Topbar title="Configuración" subtitle="Parámetros del sistema — solo administradores" />

      <div className="p-6 space-y-8 max-w-3xl">

        {hasConfigError && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            No se pudo cargar la configuración. Verificá la conexión con la base de datos.
          </div>
        )}

        {/* ── Restaurante ── */}
        <section>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
            Datos del restaurante
          </h2>
          {restaurante.length > 0 ? (
            <div className="rounded-xl border border-amber-900/20 bg-[#0a1628] divide-y divide-amber-900/10">
              {restaurante.map((item) => (
                <ConfigForm key={item.key} item={item} />
              ))}
            </div>
          ) : (
            <EmptySection message="No se encontraron parámetros de restaurante." />
          )}
        </section>

        {/* ── Nómina ── */}
        <section>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
            Configuración de nómina
          </h2>
          {nomina.length > 0 ? (
            <div className="rounded-xl border border-amber-900/20 bg-[#0a1628] divide-y divide-amber-900/10">
              {nomina.map((item) => (
                <ConfigForm key={item.key} item={item} />
              ))}
            </div>
          ) : (
            <EmptySection message="No se encontraron parámetros de nómina." />
          )}
        </section>

        {/* ── Alertas ── */}
        <section>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
            Alertas de stock
          </h2>
          {alertas.length > 0 ? (
            <div className="rounded-xl border border-amber-900/20 bg-[#0a1628] divide-y divide-amber-900/10">
              {alertas.map((item) => (
                <ConfigForm key={item.key} item={item} />
              ))}
            </div>
          ) : (
            <EmptySection message="No se encontraron parámetros de alertas." />
          )}
        </section>

        {/* ── Usuarios ── */}
        <section>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
            Usuarios del sistema
          </h2>
          {hasProfilesError ? (
            <EmptySection message="No se pudo cargar la lista de usuarios." />
          ) : (
            <UsersTable profiles={profiles} />
          )}
        </section>

      </div>
    </div>
  )
}
