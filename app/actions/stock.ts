'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ─── Tipos de respuesta ───────────────────────────────────────────────────

type ActionResult = { success: true; message: string } | { success: false; error: string }

// ─── Schema: Item ────────────────────────────────────────────────────────
// La tabla items en DB: name, category_id, unit_id, supplier_id (nullable), notes (nullable)
// Nota: reorder_point vive en stock_current (por ubicación), no en items

const ItemSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  notes: z.string().optional(),
  category_id: z.string().uuid('Seleccioná una categoría'),
  unit_id: z.string().uuid('Seleccioná una unidad'),
  supplier_id: z.string().uuid().optional().nullable(),
})

// ─── Items ────────────────────────────────────────────────────────────────

export async function createItem(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const parsed = ItemSchema.safeParse({
    name: formData.get('name'),
    notes: formData.get('notes') || undefined,
    category_id: formData.get('category_id'),
    unit_id: formData.get('unit_id'),
    supplier_id: formData.get('supplier_id') || null,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { error } = await supabase.from('items').insert({
    name: parsed.data.name,
    notes: parsed.data.notes ?? null,
    category_id: parsed.data.category_id,
    unit_id: parsed.data.unit_id,
    supplier_id: parsed.data.supplier_id ?? null,
    // item_code es auto-generado por trigger en la DB (ELC-0001)
  })

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Ya existe un ítem con ese nombre' }
    return { success: false, error: error.message }
  }

  revalidatePath('/stock')
  return { success: true, message: 'Ítem creado correctamente' }
}

export async function updateItem(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const parsed = ItemSchema.safeParse({
    name: formData.get('name'),
    notes: formData.get('notes') || undefined,
    category_id: formData.get('category_id'),
    unit_id: formData.get('unit_id'),
    supplier_id: formData.get('supplier_id') || null,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { error } = await supabase
    .from('items')
    .update({
      name: parsed.data.name,
      notes: parsed.data.notes ?? null,
      category_id: parsed.data.category_id,
      unit_id: parsed.data.unit_id,
      supplier_id: parsed.data.supplier_id ?? null,
    })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) return { success: false, error: error.message }

  revalidatePath('/stock')
  return { success: true, message: 'Ítem actualizado' }
}

export async function deleteItem(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/stock')
  return { success: true, message: 'Ítem eliminado' }
}

// ─── Movimientos de stock ─────────────────────────────────────────────────
// La tabla stock_movements en DB: item_id, location_id, type (enum), quantity, reason, responsible_id

const MovimientoSchema = z.object({
  item_id: z.string().uuid('Seleccioná un ítem'),
  location_id: z.string().uuid('Seleccioná una ubicación'),
  type: z.enum(['ENTRADA', 'SALIDA', 'AJUSTE', 'MERMA', 'TRANSFERENCIA']),
  quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  reason: z.string().optional(),
})

export async function registrarMovimiento(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const parsed = MovimientoSchema.safeParse({
    item_id: formData.get('item_id'),
    location_id: formData.get('location_id'),
    type: formData.get('movement_type'),
    quantity: formData.get('quantity'),
    reason: formData.get('reason') || undefined,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase.from('stock_movements').insert({
    item_id: parsed.data.item_id,
    location_id: parsed.data.location_id,
    type: parsed.data.type,
    quantity: parsed.data.quantity,
    reason: parsed.data.reason ?? null,
    responsible_id: user.id,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/stock')
  return { success: true, message: 'Movimiento registrado correctamente' }
}
