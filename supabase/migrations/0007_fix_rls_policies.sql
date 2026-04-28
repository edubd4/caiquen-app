-- ================================================================
-- MIGRACIÓN 0007: Fix RLS — Infinite recursion + empanada_stock INSERT
-- ================================================================
-- Bug 1: Políticas en 10+ tablas usaban EXISTS (SELECT 1 FROM profiles ...)
--        para verificar admin. Eso triggerea las RLS de profiles, que a su vez
--        hacen el mismo subquery → bucle infinito.
-- Fix:   Función is_admin() SECURITY DEFINER que lee profiles sin RLS.
--
-- Bug 2: apply_empanada_movement() intentaba INSERT en empanada_stock pero
--        esa tabla solo tenía policy SELECT → RLS violation.
-- Fix:   SECURITY DEFINER en ambas funciones trigger (empanada + stock).
-- ================================================================

-- ----------------------------------------------------------------
-- 1. Función helper is_admin() — SECURITY DEFINER rompe el ciclo
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
$$;

-- ----------------------------------------------------------------
-- 2. Fix profiles — las únicas policies verdaderamente recursivas
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins pueden ver todos los profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins pueden actualizar profiles" ON public.profiles;

CREATE POLICY "Admins pueden ver todos los profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins pueden actualizar profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- ----------------------------------------------------------------
-- 3. Fix todas las tablas que chequeaban profiles directamente
-- ----------------------------------------------------------------

DROP POLICY IF EXISTS "Solo admins pueden ver audit_logs" ON public.audit_logs;
CREATE POLICY "Solo admins pueden ver audit_logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Solo admins pueden modificar config" ON public.app_config;
CREATE POLICY "Solo admins pueden modificar config"
  ON public.app_config FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins pueden gestionar suppliers" ON public.suppliers;
CREATE POLICY "Admins pueden gestionar suppliers"
  ON public.suppliers FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins pueden gestionar items" ON public.items;
CREATE POLICY "Admins pueden gestionar items"
  ON public.items FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins pueden gestionar empleados" ON public.employees;
CREATE POLICY "Admins pueden gestionar empleados"
  ON public.employees FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins pueden gestionar períodos" ON public.payroll_periods;
CREATE POLICY "Admins pueden gestionar períodos"
  ON public.payroll_periods FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins pueden registrar adelantos" ON public.payroll_advances;
CREATE POLICY "Admins pueden registrar adelantos"
  ON public.payroll_advances FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins pueden gestionar recetas" ON public.recipes;
CREATE POLICY "Admins pueden gestionar recetas"
  ON public.recipes FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins pueden gestionar ingredientes" ON public.recipe_items;
CREATE POLICY "Admins pueden gestionar ingredientes"
  ON public.recipe_items FOR ALL
  USING (public.is_admin());

-- ----------------------------------------------------------------
-- 4. Fix trigger functions — SECURITY DEFINER para bypass RLS
--    en tablas ledger derivadas (empanada_stock, stock_current)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_empanada_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  delta NUMERIC;
BEGIN
  CASE NEW.type
    WHEN 'PRODUCCION'    THEN delta :=  ABS(NEW.quantity);
    WHEN 'VENTA_FINDE'   THEN delta := -ABS(NEW.quantity);
    WHEN 'REPOSICION_BAR'THEN delta :=  NEW.quantity;
    WHEN 'RETIRO'        THEN delta := -ABS(NEW.quantity);
    WHEN 'CONSUMICION'   THEN delta := -ABS(NEW.quantity);
    ELSE                      delta :=  NEW.quantity;
  END CASE;

  INSERT INTO public.empanada_stock (flavor_id, location, quantity)
  VALUES (NEW.flavor_id, NEW.location, delta)
  ON CONFLICT (flavor_id, location)
  DO UPDATE SET
    quantity   = public.empanada_stock.quantity + delta,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  delta NUMERIC;
BEGIN
  CASE NEW.type
    WHEN 'ENTRADA'       THEN delta :=  ABS(NEW.quantity);
    WHEN 'SALIDA'        THEN delta := -ABS(NEW.quantity);
    WHEN 'MERMA'         THEN delta := -ABS(NEW.quantity);
    WHEN 'AJUSTE'        THEN delta :=  NEW.quantity;
    WHEN 'TRANSFERENCIA' THEN delta :=  NEW.quantity;
    ELSE                      delta :=  NEW.quantity;
  END CASE;

  INSERT INTO public.stock_current (item_id, location_id, quantity)
  VALUES (NEW.item_id, NEW.location_id, delta)
  ON CONFLICT (item_id, location_id)
  DO UPDATE SET
    quantity   = public.stock_current.quantity + delta,
    updated_at = NOW();

  RETURN NEW;
END;
$$;
