import { redirect } from 'next/navigation'

// La ruta raíz redirige al inicio del dashboard.
// Este archivo existe por el scaffold del create-next-app.
// El dashboard real vive en app/(dashboard)/inicio/page.tsx
export default function RootPage() {
  redirect('/inicio')
}
