'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

type ActionResult<T = void> =
  | { success: true; message: string; data?: T }
  | { success: false; error: string }

// ─── Recetas ──────────────────────────────────────────────────────────────

const RecetaSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  description: z.string().optional(),
  notes: z.string().optional(),
  yield_qty: z.coerce.number().positive().optional().nullable(),
  yield_unit: z.string().uuid().optional().nullable(),
})

export async function createReceta(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const parsed = RecetaSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    notes: formData.get('notes') || undefined,
    yield_qty: formData.get('yield_qty') || null,
    yield_unit: formData.get('yield_unit') || null,
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { error } = await supabase.from('recipes').insert({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    notes: parsed.data.notes ?? null,
    yield_qty: parsed.data.yield_qty ?? null,
    yield_unit: parsed.data.yield_unit ?? null,
  })
  if (error) return { success: false, error: error.message }
  revalidatePath('/produccion')
  return { success: true, message: 'Receta creada' }
}

export async function updateReceta(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const parsed = RecetaSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    notes: formData.get('notes') || undefined,
    yield_qty: formData.get('yield_qty') || null,
    yield_unit: formData.get('yield_unit') || null,
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { error } = await supabase.from('recipes').update({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    notes: parsed.data.notes ?? null,
    yield_qty: parsed.data.yield_qty ?? null,
    yield_unit: parsed.data.yield_unit ?? null,
  }).eq('id', id).is('deleted_at', null)
  if (error) return { success: false, error: error.message }
  revalidatePath('/produccion')
  return { success: true, message: 'Receta actualizada' }
}

export async function deleteReceta(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('recipes')
    .update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/produccion')
  return { success: true, message: 'Receta eliminada' }
}

// ─── BOM (ingredientes de receta) ─────────────────────────────────────────

const BomItemSchema = z.object({
  recipe_id: z.string().min(1),
  item_id: z.string().uuid('Seleccioná un ingrediente'),
  unit_id: z.string().uuid('Seleccioná una unidad'),
  quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  notes: z.string().optional(),
})

export async function addBomItem(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const parsed = BomItemSchema.safeParse({
    recipe_id: formData.get('recipe_id'),
    item_id: formData.get('item_id'),
    unit_id: formData.get('unit_id'),
    quantity: formData.get('quantity'),
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { error } = await supabase.from('recipe_items').insert({
    recipe_id: parsed.data.recipe_id,
    item_id: parsed.data.item_id,
    unit_id: parsed.data.unit_id,
    quantity: parsed.data.quantity,
    notes: parsed.data.notes ?? null,
  })
  if (error) return { success: false, error: error.message }
  revalidatePath('/produccion')
  return { success: true, message: 'Ingrediente agregado' }
}

export async function removeBomItem(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('recipe_items').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/produccion')
  return { success: true, message: 'Ingrediente eliminado' }
}

// ─── Factibilidad ─────────────────────────────────────────────────────────

type FeasibilityRow = {
  item_id: string; item_name: string
  required_qty: number; available_qty: number; missing_qty: number; unit_abbr: string
}

export async function checkFactibilidad(
  recipeId: string, qty: number, locationId?: string
): Promise<ActionResult<FeasibilityRow[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('check_production_feasibility', {
    p_recipe_id: recipeId,
    p_qty: qty,
    ...(locationId ? { p_location_id: locationId } : {}),
  })
  if (error) return { success: false, error: error.message }
  return { success: true, message: 'OK', data: data as FeasibilityRow[] }
}

// ─── Logs de producción ───────────────────────────────────────────────────

const LogSchema = z.object({
  recipe_id: z.string().min(1, 'Seleccioná una receta'),
  qty_produced: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  location_id: z.string().uuid().optional().nullable(),
  production_date: z.string().optional(),
  actual_yield: z.coerce.number().optional().nullable(),
  yield_notes: z.string().optional(),
})

export async function registrarProduccionReceta(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const parsed = LogSchema.safeParse({
    recipe_id: formData.get('recipe_id'),
    qty_produced: formData.get('qty_produced'),
    location_id: formData.get('location_id') || null,
    production_date: formData.get('production_date') || undefined,
    actual_yield: formData.get('actual_yield') || null,
    yield_notes: formData.get('yield_notes') || undefined,
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('production_logs').insert({
    recipe_id: parsed.data.recipe_id,
    qty_produced: parsed.data.qty_produced,
    location_id: parsed.data.location_id ?? null,
    production_date: parsed.data.production_date ?? new Date().toISOString().split('T')[0],
    actual_yield: parsed.data.actual_yield ?? null,
    yield_notes: parsed.data.yield_notes ?? null,
    registered_by: user?.id ?? null,
    status: 'COMPLETADO',
  })
  if (error) return { success: false, error: error.message }
  revalidatePath('/produccion')
  return { success: true, message: 'Producción registrada. El stock se actualizó automáticamente.' }
}
