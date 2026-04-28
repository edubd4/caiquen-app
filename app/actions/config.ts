'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

type ActionResult = { success: true; message: string } | { success: false; error: string }

// ─── App Config ───────────────────────────────────────────────────────────────

const ConfigSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
})

export async function updateAppConfig(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const parsed = ConfigSchema.safeParse({
    key: formData.get('key'),
    value: formData.get('value'),
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { error } = await supabase
    .from('app_config')
    .update({
      value: parsed.data.value,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('key', parsed.data.key)

  if (error) return { success: false, error: error.message }

  revalidatePath('/configuracion')
  return { success: true, message: 'Configuración guardada' }
}

// ─── Usuarios / Profiles ──────────────────────────────────────────────────────

const RoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['admin', 'empleado']),
})

export async function updateUserRole(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  // Verificar que quien ejecuta es admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { success: false, error: 'Sin permisos' }

  const parsed = RoleSchema.safeParse({
    user_id: formData.get('user_id'),
    role: formData.get('role'),
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  // No permitir que un admin se quite el rol a sí mismo
  if (parsed.data.user_id === user.id && parsed.data.role !== 'admin') {
    return { success: false, error: 'No podés quitarte el rol de admin a vos mismo' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: parsed.data.role })
    .eq('id', parsed.data.user_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/configuracion')
  return { success: true, message: 'Rol actualizado' }
}
