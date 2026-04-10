import { Topbar } from '@/components/layout/topbar'
import { createClient } from '@/lib/supabase/server'
import { ItemsTable } from '@/components/stock/items-table'
import { StockActions } from '@/components/stock/stock-actions'
import type { StockItem } from '@/components/stock/items-table'

export const revalidate = 0

export default async function StockPage() {
  const supabase = await createClient()

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

    supabase
      .from('categories')
      .select('id, name')
      .order('name'),

    supabase
      .from('units')
      .select('id, name, abbreviation')
      .order('name'),

    supabase
      .from('suppliers')
      .select('id, name')
      .is('deleted_at', null)
      .order('name'),

    supabase
      .from('locations')
      .select('id, name')
      .order('name'),
  ])

  const items = (itemsRes.data ?? []) as unknown as StockItem[]
  const categories = categoriesRes.data ?? []
  const units = unitsRes.data ?? []
  const suppliers = suppliersRes.data ?? []
  const locations = locationsRes.data ?? []

  // Datos para el form de movimiento (solo nombre e item_code)
  const itemsForMovimiento = items.map(i => ({
    id: i.id,
    name: i.name,
    item_code: i.item_code,
    units: i.units,
  }))

  return (
    <div>
      <Topbar title="Stock" subtitle="Catálogo maestro e inventario" />

      <div className="p-6 space-y-5">
        <StockActions items={itemsForMovimiento} locations={locations} />
        <ItemsTable
          items={items}
          categories={categories}
          units={units}
          suppliers={suppliers}
        />
      </div>
    </div>
  )
}
