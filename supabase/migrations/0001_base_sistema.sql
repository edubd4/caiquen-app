-- ================================================================
-- MIGRACIÓN 0001: Base del sistema — El Caiquen
-- Tablas: profiles, audit_logs, app_config
-- ================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------
-- ENUMs del sistema
-- ----------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('admin', 'empleado');
CREATE TYPE stock_movement_type AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE', 'MERMA', 'TRANSFERENCIA');
CREATE TYPE emp_movement_type AS ENUM ('PRODUCCION', 'VENTA_FINDE', 'REPOSICION_BAR', 'RETIRO', 'CONSUMICION');
CREATE TYPE emp_sabor AS ENUM ('CARNE', 'PICANTE', 'POLLO', 'TYQ', 'JYQ', 'QCH', 'HUMITA');
CREATE TYPE emp_location AS ENUM ('BAR', 'FABRICA', 'SAN_MIGUEL');

-- ----------------------------------------------------------------
-- TABLA: profiles
-- Extiende auth.users con rol y datos del empleado
-- ----------------------------------------------------------------
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        user_role NOT NULL DEFAULT 'empleado',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-crear profile cuando se crea un usuario en auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE(
      (NEW.raw_user_meta_data ->> 'role')::user_role,
      'empleado'
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: updated_at automático
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------
-- TABLA: audit_logs (inmutable — solo INSERT)
-- ----------------------------------------------------------------
CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name  TEXT NOT NULL,
  record_id   TEXT NOT NULL,
  action      TEXT NOT NULL, -- INSERT | UPDATE | SOFT_DELETE
  old_data    JSONB,
  new_data    JSONB,
  user_id     UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevenir UPDATE y DELETE en audit_logs
CREATE OR REPLACE RULE audit_logs_no_update AS
  ON UPDATE TO public.audit_logs DO INSTEAD NOTHING;

CREATE OR REPLACE RULE audit_logs_no_delete AS
  ON DELETE TO public.audit_logs DO INSTEAD NOTHING;

-- ----------------------------------------------------------------
-- TABLA: app_config
-- Parámetros de configuración key-value
-- ----------------------------------------------------------------
CREATE TABLE public.app_config (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES auth.users(id)
);

-- Datos iniciales de configuración
INSERT INTO public.app_config (key, value, description) VALUES
  ('restaurant_name', 'El Caiquen', 'Nombre del restaurante'),
  ('currency', 'ARS', 'Moneda del sistema'),
  ('timezone', 'America/Argentina/Buenos_Aires', 'Zona horaria'),
  ('stock_alert_telegram', 'false', 'Enviar alertas de stock por Telegram'),
  ('payroll_week_start', 'monday', 'Día de inicio de semana laboral');

-- ----------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver su propio profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins pueden ver todos los profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins pueden actualizar profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo admins pueden ver audit_logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Sistema puede insertar audit_logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- app_config
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos los usuarios pueden leer config"
  ON public.app_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solo admins pueden modificar config"
  ON public.app_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
