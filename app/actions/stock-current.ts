'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

type ActionResult = { success: true; message: string } | { success: false; error: string }

const ReorderSchema = z.object({
  item_id: z.string().uuid(),
  location_id: z.string().uuid(),
  reorder_point: z.coerce.number().min(0),
})

/**
 * Actualiza el stock mínimo (reorder_point) para un ítem en una ubicación.
 * Si no existe el registro en stock_current, lo crea con quantity=0.
 */
export async function updateReorderPoint(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const parsed = ReorderSchema.safeParse({
    item_id: formData.get('item_id'),
    location_id: formData.get('location_id'),
    reorder_point: formData.get('reorder_point'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { item_id, location_id, reorder_point } = parsed.data

  // Upsert: si existe actualiza, si no existe crea con quantity=0
  const { error } = await supabase
    .from('stock_current')
    .upsert(
      { item_id, location_id, reorder_point, quantity: 0 },
      { onConflict: 'item_id,location_id', ignoreDuplicates: false }
    )

  if (error) return { success: false, error: error.message }

  revalidatePath('/stock')
  return { success: true, message: 'Stock mínimo actualizado' }
}
