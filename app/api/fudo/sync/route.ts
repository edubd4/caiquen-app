import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Schema de validación ─────────────────────────────────────────────────────

const SyncItemSchema = z.object({
  fudo_product_id: z.string().min(1, 'fudo_product_id requerido'),
  qty_sold: z.number().positive('qty_sold debe ser mayor a 0'),
})

const SyncBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date debe tener formato YYYY-MM-DD'),
  items: z.array(SyncItemSchema).min(1, 'items no puede estar vacío'),
})

// ─── Tipos ────────────────────────────────────────────────────────────────────

type SyncResult = {
  date: string
  synced: number
  skipped: number
  skipped_ids: string[]
  errors: string[]
}

// ─── POST /api/fudo/sync ──────────────────────────────────────────────────────
//
// Recibe ventas del día desde n8n (que las obtiene de Fudo General API).
// Por cada producto vendido:
//   1. Busca en fudo_product_mappings → item_id + location_id
//   2. Inserta en stock_movements con type SALIDA
//   3. El trigger de PostgreSQL actualiza stock_current automáticamente
//
// Autenticación: header Authorization: Bearer {FUDO_SYNC_SECRET}
// Este endpoint NO usa Supabase Auth — usa un secret compartido con n8n.

export async function POST(request: NextRequest) {
  // ── 1. Verificar secret ───────────────────────────────────────────────────
  const syncSecret = process.env.FUDO_SYNC_SECRET
  if (!syncSecret) {
    console.error('[fudo/sync] FUDO_SYNC_SECRET no está configurada')
    return NextResponse.json({ error: 'Configuración inválida' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '').trim()

  if (!token || token !== syncSecret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // ── 2. Parsear y validar body ─────────────────────────────────────────────
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
  }

  const parsed = SyncBodySchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.issues },
      { status: 422 }
    )
  }

  const { date, items } = parsed.data
  const supabase = createAdminClient()

  const result: SyncResult = {
    date,
    synced: 0,
    skipped: 0,
    skipped_ids: [],
    errors: [],
  }

  // ── 3. Procesar cada ítem vendido ─────────────────────────────────────────
  for (const soldItem of items) {
    // Buscar mapeo Fudo → Caiquen
    const { data: mapping, error: mappingError } = await supabase
      .from('fudo_product_mappings')
      .select('item_id, location_id')
      .eq('fudo_product_id', soldItem.fudo_product_id)
      .eq('active', true)
      .single()

    if (mappingError || !mapping) {
      // Sin mapeo → loguear y continuar (no es error crítico)
      console.warn(
        `[fudo/sync] Sin mapeo para fudo_product_id="${soldItem.fudo_product_id}" — se omite`
      )
      result.skipped++
      result.skipped_ids.push(soldItem.fudo_product_id)
      continue
    }

    // Insertar movimiento de SALIDA
    const { error: movError } = await supabase.from('stock_movements').insert({
      item_id: mapping.item_id,
      location_id: mapping.location_id,
      type: 'SALIDA',
      quantity: soldItem.qty_sold,
      reason: `Venta Fudo ${date}`,
      responsible_id: null, // sistema automatizado — sin usuario Supabase
    })

    if (movError) {
      console.error(
        `[fudo/sync] Error insertando movimiento para item_id="${mapping.item_id}":`,
        movError.message
      )
      result.errors.push(`item_id=${mapping.item_id}: ${movError.message}`)
      continue
    }

    result.synced++
  }

  // ── 4. Log del resultado ──────────────────────────────────────────────────
  console.info(
    `[fudo/sync] Sync ${date} completo — synced: ${result.synced}, skipped: ${result.skipped}, errors: ${result.errors.length}`
  )

  const status = result.errors.length > 0 ? 207 : 200 // 207 = Multi-Status (parcial)
  return NextResponse.json(result, { status })
}
