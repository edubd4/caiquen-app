'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

type ActionResult = { success: true; message: string } | { success: false; error: string }

// ─── Registrar producción ─────────────────────────────────────────────────
// Inserta en empanada_production → trigger actualiza empanada_stock

const ProduccionSchema = z.object({
  flavor_id: z.string().uuid('Seleccioná un sabor'),
  quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  source_location: z.enum(['BAR', 'FABRICA', 'SAN_MIGUEL']),
  production_date: z.string().optional(),
  notes: z.string().optional(),
})

export async function registrarProduccion(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const parsed = ProduccionSchema.safeParse({
    flavor_id: formData.get('flavor_id'),
    quantity: formData.get('quantity'),
    source_location: formData.get('source_location'),
    production_date: formData.get('production_date') || undefined,
    notes: formData.get('notes') || undefined,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase.from('empanada_production').insert({
    flavor_id: parsed.data.flavor_id,
    quantity: parsed.data.quantity,
    source_location: parsed.data.source_location,
    production_date: parsed.data.production_date ?? new Date().toISOString().split('T')[0],
    notes: parsed.data.notes ?? null,
    registered_by: user.id,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/empanadas')
  return { success: true, message: 'Producción registrada correctamente' }
}

// ─── Registrar movimiento ─────────────────────────────────────────────────
// Inserta en empanada_movements → trigger actualiza empanada_stock

const MovimientoSchema = z.object({
  flavor_id: z.string().uuid('Seleccioná un sabor'),
  location: z.enum(['BAR', 'FABRICA', 'SAN_MIGUEL']),
  type: z.enum(['PRODUCCION', 'VENTA_FINDE', 'REPOSICION_BAR', 'RETIRO', 'CONSUMICION']),
  quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  notes: z.string().optional(),
})

export async function registrarMovimientoEmpanada(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const parsed = MovimientoSchema.safeParse({
    flavor_id: formData.get('flavor_id'),
    location: formData.get('location'),
    type: formData.get('movement_type'),
    quantity: formData.get('quantity'),
    notes: formData.get('notes') || undefined,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase.from('empanada_movements').insert({
    flavor_id: parsed.data.flavor_id,
    location: parsed.data.location,
    type: parsed.data.type,
    quantity: parsed.data.quantity,
    notes: parsed.data.notes ?? null,
    responsible_id: user.id,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/empanadas')
  return { success: true, message: 'Movimiento registrado correctamente' }
}
