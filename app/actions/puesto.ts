'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

type ActionResult = { success: true; message: string } | { success: false; error: string }

// ─── Productos ────────────────────────────────────────────────────────────────

const ProductoSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  category: z.string().min(1, 'La categoría es requerida'),
  notes: z.string().optional(),
})

export async function createProducto(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const parsed = ProductoSchema.safeParse({
    name: formData.get('name'),
    category: formData.get('category'),
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { error } = await supabase.from('regional_products').insert({
    name: parsed.data.name,
    category: parsed.data.category,
    notes: parsed.data.notes ?? null,
  })
  if (error) return { success: false, error: error.message }

  revalidatePath('/puesto')
  return { success: true, message: 'Producto creado correctamente' }
}

export async function updateProducto(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const parsed = ProductoSchema.safeParse({
    name: formData.get('name'),
    category: formData.get('category'),
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { error } = await supabase
    .from('regional_products')
    .update({ name: parsed.data.name, category: parsed.data.category, notes: parsed.data.notes ?? null })
    .eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/puesto')
  return { success: true, message: 'Producto actualizado correctamente' }
}

export async function deleteProducto(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('regional_products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/puesto')
  return { success: true, message: 'Producto eliminado' }
}

// ─── Stock ────────────────────────────────────────────────────────────────────

const StockEntrySchema = z.object({
  product_id: z.string().min(1, 'Seleccioná un producto'),
  presentation: z.string().min(1, 'La presentación es requerida'),
  quantity: z.coerce.number().min(0, 'La cantidad no puede ser negativa'),
  reorder_point: z.coerce.number().min(0).default(0),
  price: z.coerce.number().min(0).optional(),
})

export async function upsertStockEntry(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const parsed = StockEntrySchema.safeParse({
    product_id: formData.get('product_id'),
    presentation: formData.get('presentation'),
    quantity: formData.get('quantity'),
    reorder_point: formData.get('reorder_point') || 0,
    price: formData.get('price') || undefined,
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { error } = await supabase.from('regional_stock').upsert(
    {
      product_id: parsed.data.product_id,
      presentation: parsed.data.presentation,
      quantity: parsed.data.quantity,
      reorder_point: parsed.data.reorder_point,
      price: parsed.data.price ?? null,
    },
    { onConflict: 'product_id,presentation' }
  )
  if (error) return { success: false, error: error.message }

  revalidatePath('/puesto')
  return { success: true, message: 'Stock actualizado correctamente' }
}

export async function updateStockQty(id: string, quantity: number): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('regional_stock')
    .update({ quantity })
    .eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/puesto')
  return { success: true, message: 'Stock actualizado' }
}
