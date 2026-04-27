import { Topbar } from '@/components/layout/topbar'
import { createClient } from '@/lib/supabase/server'
import { TabsNav } from '@/components/ui/tabs-nav'
import { RecetasList } from '@/components/produccion/recetas-list'
import { ProduccionLogForm } from '@/components/produccion/produccion-log-form'
import { ProduccionLogsTable } from '@/components/produccion/produccion-logs-table'
import { Suspense } from 'react'
import type { Receta } from '@/components/produccion/recetas-list'

export const revalidate = 0

interface ProduccionPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function ProduccionPage({ searchParams }: ProduccionPageProps) {
  const supabase = await createClient()
  const { tab } = await searchParams
  const activeTab = ['recetas', 'registro'].includes(tab ?? '') ? tab! : 'recetas'

  // Always needed
  const [recetasRes, itemsRes, unitsRes, locationsRes] = await Promise.all([
    supabase
      .from('recipes')
      .select(`
        id, name, description, notes, yield_qty, yield_unit, created_at,
        recipe_items (
          id, item_id, unit_id, quantity, notes,
          items ( name, item_code ),
          units ( abbreviation )
        ),
        units ( name, abbreviation )
      `)
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('items')
      .select('id, name, item_code')
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('units')
      .select('id, name, abbreviation')
      .order('name'),
    supabase
      .from('locations')
      .select('id, name')
      .order('name'),
  ])

  const recetas = (recetasRes.data ?? []) as unknown as Receta[]
  const items = itemsRes.data ?? []
  const units = unitsRes.data ?? []
  const locations = locationsRes.data ?? []

  // Logs — only when on registro tab
  let logs: Parameters<typeof ProduccionLogsTable>[0]['logs'] = []
  if (activeTab === 'registro') {
    const { data } = await supabase
      .from('production_logs')
      .select(`
        id, recipe_id, qty_produced, location_id, production_date,
        actual_yield, yield_notes, status, created_at,
        recipes ( name ),
        locations ( name )
      `)
      .order('production_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200)
    logs = (data ?? []) as typeof logs
  }

  const tabs = [
    { label: 'Recetas', value: 'recetas', count: recetas.length },
    { label: 'Registro de producción', value: 'registro' },
  ]

  return (
    <div>
      <Topbar title="Producción" subtitle="Recetas BOM, ingredientes y registro de lotes" />

      <div className="p-6 space-y-5">
        <Suspense>
          <TabsNav tabs={tabs} />
        </Suspense>

        {activeTab === 'recetas' && (
          <RecetasList
            recetas={recetas}
            items={items}
            units={units}
            locations={locations}
          />
        )}

        {activeTab === 'registro' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ProduccionLogForm recetas={recetas} locations={locations} />
            </div>
            <div className="lg:col-span-2">
              <ProduccionLogsTable logs={logs} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
