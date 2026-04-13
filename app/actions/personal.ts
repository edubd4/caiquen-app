'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

type ActionResult = { success: true; message: string } | { success: false; error: string }

// ─── Empleados ────────────────────────────────────────────────────────────

const EmpleadoSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  position_id: z.string().uuid('Seleccioná un puesto'),
  base_salary: z.coerce.number().min(0, 'El sueldo no puede ser negativo'),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

export async function createEmpleado(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const parsed = EmpleadoSchema.safeParse({
    full_name: formData.get('full_name'),
    position_id: formData.get('position_id'),
    base_salary: formData.get('base_salary'),
    phone: formData.get('phone') || undefined,
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { error } = await supabase.from('employees').insert({
    full_name: parsed.data.full_name,
    position_id: parsed.data.position_id,
    base_salary: parsed.data.base_salary,
    phone: parsed.data.phone ?? null,
    notes: parsed.data.notes ?? null,
  })

  if (error) return { success: false, error: error.message }
  revalidatePath('/personal')
  return { success: true, message: 'Empleado creado' }
}

export async function updateEmpleado(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const parsed = EmpleadoSchema.safeParse({
    full_name: formData.get('full_name'),
    position_id: formData.get('position_id'),
    base_salary: formData.get('base_salary'),
    phone: formData.get('phone') || undefined,
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { error } = await supabase.from('employees').update({
    full_name: parsed.data.full_name,
    position_id: parsed.data.position_id,
    base_salary: parsed.data.base_salary,
    phone: parsed.data.phone ?? null,
    notes: parsed.data.notes ?? null,
  }).eq('id', id).is('deleted_at', null)

  if (error) return { success: false, error: error.message }
  revalidatePath('/personal')
  return { success: true, message: 'Empleado actualizado' }
}

export async function deleteEmpleado(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('employees')
    .update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/personal')
  return { success: true, message: 'Empleado eliminado' }
}

// ─── Turnos ───────────────────────────────────────────────────────────────

const TurnoSchema = z.object({
  employee_id: z.string().uuid('Seleccioná un empleado'),
  date: z.string().min(1, 'Seleccioná una fecha'),
  time_in: z.string().optional().nullable(),
  time_out: z.string().optional().nullable(),
  notes: z.string().optional(),
})

export async function upsertTurno(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const parsed = TurnoSchema.safeParse({
    employee_id: formData.get('employee_id'),
    date: formData.get('date'),
    time_in: formData.get('time_in') || null,
    time_out: formData.get('time_out') || null,
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { data: { user } } = await supabase.auth.getUser()

  // Buscar si ya existe un turno para ese empleado+fecha
  const { data: existing } = await supabase
    .from('shifts')
    .select('id')
    .eq('employee_id', parsed.data.employee_id)
    .eq('date', parsed.data.date)
    .single()

  const payload = {
    employee_id: parsed.data.employee_id,
    date: parsed.data.date,
    time_in: parsed.data.time_in ?? null,
    time_out: parsed.data.time_out ?? null,
    notes: parsed.data.notes ?? null,
    registered_by: user?.id ?? null,
  }

  if (existing) {
    const { error } = await supabase.from('shifts').update(payload).eq('id', existing.id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await supabase.from('shifts').insert(payload)
    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/personal')
  return { success: true, message: 'Turno registrado' }
}

// ─── Períodos de nómina ───────────────────────────────────────────────────

export async function abrirPeriodo(weekStart: string, weekEnd: string): Promise<ActionResult> {
  const supabase = await createClient()

  // Verificar que no haya un período abierto que se superponga
  const { data: existing } = await supabase
    .from('payroll_periods')
    .select('id')
    .eq('status', 'abierto')
    .lte('week_start', weekEnd)
    .gte('week_end', weekStart)

  if (existing && existing.length > 0) {
    return { success: false, error: 'Ya existe un período abierto que se superpone con esas fechas' }
  }

  const { error } = await supabase.from('payroll_periods').insert({
    week_start: weekStart,
    week_end: weekEnd,
    status: 'abierto',
  })

  if (error) return { success: false, error: error.message }
  revalidatePath('/personal')
  return { success: true, message: 'Período abierto' }
}

export async function cerrarPeriodo(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('payroll_periods').update({
    status: 'cerrado',
    closed_at: new Date().toISOString(),
    closed_by: user?.id ?? null,
  }).eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/personal')
  return { success: true, message: 'Período cerrado' }
}

// ─── Adelantos y retiros ──────────────────────────────────────────────────

const AdelantoSchema = z.object({
  employee_id: z.string().uuid(),
  period_id: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  date: z.string().min(1),
  reason: z.string().optional(),
})

export async function registrarAdelanto(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const parsed = AdelantoSchema.safeParse({
    employee_id: formData.get('employee_id'),
    period_id: formData.get('period_id') || null,
    amount: formData.get('amount'),
    date: formData.get('date'),
    reason: formData.get('reason') || undefined,
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('payroll_advances').insert({
    employee_id: parsed.data.employee_id,
    period_id: parsed.data.period_id ?? null,
    amount: parsed.data.amount,
    date: parsed.data.date,
    reason: parsed.data.reason ?? null,
    registered_by: user?.id ?? null,
  })

  if (error) return { success: false, error: error.message }
  revalidatePath('/personal')
  return { success: true, message: 'Adelanto registrado' }
}
