import { Topbar } from '@/components/layout/topbar'
import { createClient } from '@/lib/supabase/server'
import { TabsNav } from '@/components/ui/tabs-nav'
import { ProductosTable } from '@/components/puesto/productos-table'
import { StockPuestoTable } from '@/components/puesto/stock-puesto-table'
import { Suspense } from 'react'
import type { Producto } from '@/components/puesto/producto-form'
import type { StockConProducto } from '@/components/puesto/stock-puesto-table'

export const revalidate = 0

interface PuestoPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function PuestoPage({ searchParams }: PuestoPageProps) {
  const supabase = await createClient()
  const { tab } = await searchParams
  const activeTab = ['productos', 'stock'].includes(tab ?? '') ? tab! : 'productos'

  const [productosRes, stockRes] = await Promise.all([
    supabase
      .from('regional_products')
      .select('id, name, category, notes')
      .is('deleted_at', null)
      .order('category')
      .order('name'),

    supabase
      .from('regional_stock')
      .select(`
        id, product_id, presentation, quantity, reorder_point, price,
        regional_products ( name, category )
      `)
      .order('product_id')
      .order('presentation'),
  ])

  const productos = (productosRes.data ?? []) as Producto[]
  const stock = (stockRes.data ?? []) as unknown as StockConProducto[]

  const tabs = [
    { label: 'Productos', value: 'productos', count: productos.length },
    { label: 'Stock', value: 'stock', count: stock.length },
  ]

  return (
    <div>
      <Topbar
        title="Puesto Regional"
        subtitle="Productos artesanales, mieles, dulces y aceites"
      />

      <div className="p-6 space-y-5">
        <Suspense>
          <TabsNav tabs={tabs} />
        </Suspense>

        {activeTab === 'productos' && (
          <ProductosTable productos={productos} />
        )}

        {activeTab === 'stock' && (
          <StockPuestoTable stock={stock} productos={productos} />
        )}
      </div>
    </div>
  )
}
