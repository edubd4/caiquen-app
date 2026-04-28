import { Topbar } from '@/components/layout/topbar'
import { createClient } from '@/lib/supabase/server'
import { ItemsTable } from '@/components/stock/items-table'
import { StockActions } from '@/components/stock/stock-actions'
import { MovimientosTable } from '@/components/stock/movimientos-table'
import { TabsNav } from '@/components/ui/tabs-nav'
import type { StockItem } from '@/components/stock/items-table'
import { Suspense } from 'react'

export const revalidate = 0

interface StockPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function StockPage({ searchParams }: StockPageProps) {
  const supabase = await createClient()
  const { tab } = await searchParams
  const activeTab = tab === 'movimientos' ? 'movimientos' : 'catalogo'

  // Siempre cargamos items y ubicaciones (necesarios para ambas tabs)
  const [itemsRes, categoriesRes, unitsRes, suppliersRes, locationsRes] = await Promise.all([
    supabase
      .from('items')
      .select(`
        id,
        item_code,
        name,
        notes,
        category_id,
        unit_id,
        supplier_id,
        categories ( name ),
        units ( name, abbreviation ),
        suppliers ( name ),
        stock_current ( quantity, location_id, reorder_point )
      `)
      .is('deleted_at', null)
      .order('name'),

    supabase.from('categories').select('id, name').order('name'),
    supabase.from('units').select('id, name, abbreviation').order('name'),
    supabase.from('suppliers').select('id, name').is('deleted_at', null).order('name'),
    supabase.from('locations').select('id, name').order('name'),
  ])

  const items = (itemsRes.data ?? []) as unknown as StockItem[]
  const categories = categoriesRes.data ?? []
  const units = unitsRes.data ?? []
  const suppliers = suppliersRes.data ?? []
  const locations = locationsRes.data ?? []

  // Movimientos: solo cuando está en esa tab
  let movimientos: Parameters<typeof MovimientosTable>[0]['movimientos'] = []
  if (activeTab === 'movimientos') {
    const { data } = await supabase
      .from('stock_movements')
      .select(`
        id,
        type,
        quantity,
        reason,
        created_at,
        items ( name, item_code, units ( abbreviation ) ),
        locations ( name ),
        profiles!responsible_id ( full_name, email )
      `)
      .order('created_at', { ascending: false })
      .limit(200)

    movimientos = (data ?? []) as unknown as typeof movimientos
  }

  const itemsForMovimiento = items.map(i => ({
    id: i.id,
    name: i.name,
    item_code: i.item_code,
    units: i.units,
  }))

  const tabs = [
    { label: 'Catálogo', value: 'catalogo', count: items.length },
    { label: 'Movimientos', value: 'movimientos' },
  ]

  return (
    <div>
      <Topbar title="Stock" subtitle="Catálogo maestro e inventario" />

      <div className="p-6 space-y-5">
        {/* Botón de movimiento (siempre visible) */}
        <StockActions items={itemsForMovimiento} locations={locations} />

        {/* Tabs */}
        <Suspense>
          <TabsNav tabs={tabs} />
        </Suspense>

        {/* Contenido según tab activa */}
        {activeTab === 'catalogo' ? (
          <ItemsTable
            items={items}
            categories={categories}
            units={units}
            suppliers={suppliers}
            locations={locations}
          />
        ) : (
          <MovimientosTable movimientos={movimientos} />
        )}
      </div>
    </div>
  )
}
