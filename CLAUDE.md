# El Caiquen — Sistema Operacional

Sistema de gestión operacional del Restaurante El Caiquen.
Reemplaza ~22 planillas fragmentadas con una app web integrada.

## Stack
- **Framework**: Next.js 14 (App Router) + TypeScript strict
- **DB + Auth**: Supabase PostgreSQL + Supabase Auth + RLS
- **Estilos**: Tailwind CSS v4 + shadcn/ui
- **Validación**: Zod
- **Deploy**: Dokploy (VPS Hostinger) — Node 20, output: standalone

## Patrones de arquitectura

### Supabase clients
- `lib/supabase/server.ts` → Server Components y Route Handlers (lee y escribe cookies)
- `lib/supabase/client.ts` → Client Components (SOLO para auth: signIn/signOut)
- `lib/supabase/admin.ts` → API routes que necesitan bypassar RLS (service role)

**Regla crítica**: Nunca usar el browser client para queries de datos. Siempre pasar por Server Components o API routes.

### Roles
- `admin`: acceso total, puede gestionar catálogo, empleados, recetas, config
- `empleado`: puede registrar movimientos de stock, producción, turnos. No puede editar catálogo ni config.

### Rutas protegidas
El middleware en `middleware.ts` maneja:
- Sin sesión → redirect a `/login`
- `/configuracion` → solo rol `admin`
- Auth callback → `/auth/callback`

### IDs legibles
Todos los registros principales usan IDs legibles generados por triggers PostgreSQL:
- Items: `ELC-0001`
- Empleados: `EMP-0001`
- Proveedores: `PRV-0001`
- Recetas: `REC-0001`
- Producción: `PROD-0001`

### Soft delete
Tablas con soft delete usan `deleted_at TIMESTAMPTZ`. Siempre filtrar por `deleted_at IS NULL`.

### Ledgers inmutables
`stock_movements` y `empanada_movements` son inmutables (sin UPDATE ni DELETE).
El stock actual se mantiene en `stock_current` y `empanada_stock` mediante triggers.

## Estructura de módulos

```
Fase 0: Setup + Auth (✅)
Fase 1: Catálogo Maestro + Stock General (sesiones 1.1, 1.2, 1.3)
Fase 2: Stock Empanadas (sesiones 2.1, 2.2)
Fase 3: Personal + Sueldos (sesiones 3.1, 3.2)
Fase 4: Producción + Recetas BOM (sesiones 4.1, 4.2)
Fase 5: Puesto Regional (sesión 5.1)
Fase 6: Dashboards + Alertas + Polish (sesiones 6.1, 6.2)
```

## Colores del design system
- Background: `#051426`
- Surface: `#0a1628`
- Amber (acento): `#e8a020`
- Verde stock OK: `#22c97a`
- Rojo stock crítico: `#e85a5a`

## Comandos útiles

```bash
npm run dev          # Desarrollo local
npm run build        # Build de producción
npm run lint         # Linter
npx supabase db push # Aplicar migraciones a Supabase
npx supabase gen types typescript --project-id <id> > types/database.ts
```

## Variables de entorno requeridas
Ver `.env.local.example`
