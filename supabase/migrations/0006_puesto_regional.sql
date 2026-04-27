-- ================================================================
-- MIGRACIÓN 0006: Puesto Regional — RLS
-- Las tablas regional_products y regional_stock ya existen en producción.
-- Esta migración agrega las políticas INSERT/UPDATE faltantes.
-- (Fase 5)
-- ================================================================

CREATE POLICY "Autenticados pueden insertar productos regionales"
  ON public.regional_products FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados pueden actualizar productos regionales"
  ON public.regional_products FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Autenticados pueden insertar stock regional"
  ON public.regional_stock FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados pueden actualizar stock regional"
  ON public.regional_stock FOR UPDATE TO authenticated USING (true);
