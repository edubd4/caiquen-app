import { Topbar } from '@/components/layout/topbar'
import { createClient } from '@/lib/supabase/server'
import { StockGrid } from '@/components/empanadas/stock-grid'
import { HistorialTable } from '@/components/empanadas/historial-table'
import { TabsNav } from '@/components/ui/tabs-nav'
import { Suspense } from 'react'

export const revalidate = 0

interface EmpanadasPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function EmpanadasPage({ searchParams }: EmpanadasPageProps) {
  const supabase = await createClient()
  const { tab } = await searchParams
  const activeTab = tab === 'historial' ? 'historial' : 'stock'

  // Sabores activos
  const { data: flavors } = await supabase
    .from('empanada_flavors')
    .select('id, name, code')
    .eq('active', true)
    .order('name')

  // Stock actual desde la vista
  const { data: stockData } = await supabase
    .from('v_empanada_stock_summary')
    .select('location, quantity, sabor_code, sabor_nombre, updated_at')

  // Historial solo si está en esa tab
  let historial: Parameters<typeof HistorialTable>[0]['movimientos'] = []
  if (activeTab === 'historial') {
    const { data } = await supabase
      .from('empanada_movements')
      .select(`
        id, type, location, quantity, notes, created_at,
        empanada_flavors ( name, code ),
        profiles ( full_name, email )
      `)
      .order('created_at', { ascending: false })
      .limit(200)

    historial = (data ?? []) as unknown as typeof historial
  }

  const flavorsList = (flavors ?? []) as { id: string; name: string; code: string }[]

  // Normalizar stock al tipo del grid
  const stockCells = (stockData ?? []).map(s => ({
    location: s.location as 'BAR' | 'FABRICA' | 'SAN_MIGUEL',
    quantity: Number(s.quantity ?? 0),
    sabor_code: s.sabor_code ?? '',
  }))

  // Conteo de movimientos para badge en tab
  const { count: movimientosCount } = await supabase
    .from('empanada_movements')
    .select('*', { count: 'exact', head: true })

  const tabs = [
    { label: 'Stock actual', value: 'stock' },
    { label: 'Historial', value: 'historial', count: movimientosCount ?? 0 },
  ]

  return (
    <div>
      <Topbar title="Empanadas" subtitle="Stock por sabor y ubicación" />

      <div className="p-6 space-y-5">
        <Suspense>
          <TabsNav tabs={tabs} />
        </Suspense>

        {activeTab === 'stock' ? (
          <StockGrid flavors={flavorsList} stock={stockCells} />
        ) : (
          <HistorialTable movimientos={historial} />
        )}
      </div>
    </div>
  )
}
