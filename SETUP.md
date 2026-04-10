# Setup del proyecto — El Caiquen

## Estado actual
✅ Base de datos Supabase configurada (24 tablas + RLS + triggers)  
✅ Código fuente listo en esta carpeta  
⏳ Pendiente: conectar con GitHub y correr localmente  

---

## 1. Clonar / vincular con GitHub

Tenés el repo en: `https://github.com/edubd4/caiquen-app.git`

Abrí **Git Bash** en la carpeta `caiquen-app` y ejecutá:

```bash
# Inicializar git (si no está inicializado)
git init

# Agregar el remote de GitHub
git remote add origin https://github.com/edubd4/caiquen-app.git

# Agregar todos los archivos (excepto los del .gitignore)
git add .

# Primer commit
git commit -m "feat: Fase 0 — setup completo + 5 migraciones SQL"

# Subir al repo
git push -u origin main
```

> ⚠️ Si dice que la rama se llama `master` en vez de `main`:
> ```bash
> git branch -M main
> git push -u origin main
> ```

---

## 2. Correr localmente

```bash
# Instalar dependencias (la primera vez)
npm install

# Arrancar en modo desarrollo
npm run dev
```

La app queda en: **http://localhost:3000**

---

## 3. Service Role Key (necesaria para rutas admin)

1. Ir a: https://supabase.com/dashboard/project/zuinxdycjuiunlfuiopv/settings/api
2. Copiar la **service_role** key (la que dice "secret")
3. Pegar en `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5...
   ```

---

## 4. Crear el primer usuario admin

En el Supabase Dashboard → Authentication → Users → "Add user":
- Email: tu email
- Password: la que quieras
- Luego ejecutar en el SQL Editor:
  ```sql
  UPDATE public.profiles 
  SET role = 'admin' 
  WHERE email = 'tu@email.com';
  ```

---

## 5. Deploy en Dokploy (cuando esté listo)

En el `next.config.ts` agregar:
```ts
output: 'standalone'
```

Y en Dokploy configurar las mismas variables de entorno del `.env.local`.

---

## Variables de entorno requeridas

| Variable | Dónde obtenerla |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Ya está en `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Ya está en `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role |
| `N8N_API_KEY` | Definirlo cuando se configure n8n |
