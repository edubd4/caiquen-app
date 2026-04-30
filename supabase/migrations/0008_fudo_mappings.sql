-- ================================================================
-- MIGRACIÓN 0008: Integración Fudo POS
-- Tabla: fudo_product_mappings
-- Propósito: traducir product_id de Fudo → item_id de Caiquen
-- ================================================================

CREATE TABLE public.fudo_product_mappings (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  fudo_product_id   TEXT    NOT NULL UNIQUE,  -- ID del producto en Fudo (viene del catálogo Fudo)
  fudo_product_name TEXT,                      -- nombre descriptivo solo para auditoría visual
  item_id           TEXT    NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,   -- TEXT porque items.id es ELC-0001
  location_id       UUID    NOT NULL REFERENCES public.locations(id),
  active            BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER fudo_mappings_updated_at
  BEFORE UPDATE ON public.fudo_product_mappings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Índice para lookups rápidos por fudo_product_id (hot path del sync)
CREATE INDEX idx_fudo_mappings_product ON public.fudo_product_mappings(fudo_product_id) WHERE active = true;

-- ----------------------------------------------------------------
-- RLS: solo admin puede leer/modificar los mapeos
-- El sync usa service role (admin client) → bypasa RLS
-- ----------------------------------------------------------------
ALTER TABLE public.fudo_product_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_fudo_mappings" ON public.fudo_product_mappings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admin_insert_fudo_mappings" ON public.fudo_product_mappings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admin_update_fudo_mappings" ON public.fudo_product_mappings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admin_delete_fudo_mappings" ON public.fudo_product_mappings
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
