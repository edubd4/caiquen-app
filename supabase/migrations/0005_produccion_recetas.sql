-- ================================================================
-- MIGRACIÓN 0005: Producción y Recetas (BOM)
-- Tablas: recipes, recipe_items, production_logs
-- (Fase 4)
-- ================================================================

CREATE SEQUENCE IF NOT EXISTS seq_recipes START 1;
CREATE SEQUENCE IF NOT EXISTS seq_production START 1;

-- ----------------------------------------------------------------
-- TABLA: recipes (recetas maestras)
-- ----------------------------------------------------------------
CREATE TABLE public.recipes (
  id          TEXT PRIMARY KEY DEFAULT 'REC-' || LPAD(nextval('seq_recipes')::TEXT, 4, '0'),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  yield_unit  UUID REFERENCES public.units(id), -- unidad del rendimiento
  yield_qty   NUMERIC(8, 3),                    -- cuánto produce la receta base
  notes       TEXT,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Recetas identificadas de El Caiquen
INSERT INTO public.recipes (name, description) VALUES
  ('Empanada de Carne', 'Empanada de carne clásica'),
  ('Empanada Picante', 'Empanada de carne picante'),
  ('Empanada de Pollo', 'Empanada de pollo'),
  ('Empanada de Tomate y Queso', 'Empanada TyQ'),
  ('Empanada de Jamón y Queso', 'Empanada JyQ'),
  ('Empanada de Queso y Champiñón', 'Empanada QCH'),
  ('Empanada de Humita', 'Empanada de humita'),
  ('Locro', 'Locro tradicional'),
  ('Humita', 'Humita en chala o en olla'),
  ('Milanesa de Carne', 'Milanesa de carne con papas'),
  ('Milanesa de Berenjena', 'Milanesa de berenjena'),
  ('Tamales', 'Tamales caseros');

-- ----------------------------------------------------------------
-- TABLA: recipe_items (BOM — Bill of Materials)
-- Un ítem por ingrediente, con cantidad y unidad
-- ----------------------------------------------------------------
CREATE TABLE public.recipe_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id   TEXT NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL REFERENCES public.items(id),
  quantity    NUMERIC(10, 4) NOT NULL,
  unit_id     UUID NOT NULL REFERENCES public.units(id),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(recipe_id, item_id)
);

CREATE INDEX idx_recipe_items_recipe ON public.recipe_items(recipe_id);
CREATE INDEX idx_recipe_items_item ON public.recipe_items(item_id);

-- ----------------------------------------------------------------
-- TABLA: production_logs
-- Registro de producción vinculado a stock
-- ----------------------------------------------------------------
CREATE TABLE public.production_logs (
  id              TEXT PRIMARY KEY DEFAULT 'PROD-' || LPAD(nextval('seq_production')::TEXT, 4, '0'),
  recipe_id       TEXT NOT NULL REFERENCES public.recipes(id),
  production_date DATE NOT NULL DEFAULT CURRENT_DATE,
  location_id     UUID REFERENCES public.locations(id),
  qty_produced    NUMERIC(8, 3) NOT NULL,       -- cantidad producida (en yield_unit)
  -- Rendimiento real vs teórico
  theoretical_yield NUMERIC(8, 3),             -- calculado por el sistema
  actual_yield    NUMERIC(8, 3),               -- registrado por el usuario
  yield_notes     TEXT,
  status          TEXT NOT NULL DEFAULT 'COMPLETADO'
                  CHECK (status IN ('PENDIENTE', 'COMPLETADO', 'CANCELADO')),
  registered_by   UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_production_date ON public.production_logs(production_date DESC);
CREATE INDEX idx_production_recipe ON public.production_logs(recipe_id);

-- Función: al registrar producción, descontar insumos del stock
CREATE OR REPLACE FUNCTION public.apply_production_to_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  ri RECORD;
  location_to_use UUID;
BEGIN
  -- Solo aplicar si el status es COMPLETADO
  IF NEW.status != 'COMPLETADO' THEN
    RETURN NEW;
  END IF;

  location_to_use := COALESCE(NEW.location_id,
    (SELECT id FROM public.locations WHERE name = 'Cocina' LIMIT 1)
  );

  -- Iterar por cada ingrediente de la receta
  FOR ri IN
    SELECT ri.item_id, ri.quantity * NEW.qty_produced AS total_qty
    FROM public.recipe_items ri
    WHERE ri.recipe_id = NEW.recipe_id
  LOOP
    -- Registrar salida en stock_movements
    INSERT INTO public.stock_movements (
      item_id, location_id, type, quantity, reason, responsible_id
    ) VALUES (
      ri.item_id,
      location_to_use,
      'SALIDA',
      ri.total_qty,
      'Producción: ' || NEW.id,
      NEW.registered_by
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_production_log_insert
  AFTER INSERT ON public.production_logs
  FOR EACH ROW EXECUTE FUNCTION public.apply_production_to_stock();

-- ----------------------------------------------------------------
-- FUNCIÓN: verificar stock antes de producir
-- Retorna ítems faltantes para una producción dada
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_production_feasibility(
  p_recipe_id   TEXT,
  p_qty         NUMERIC,
  p_location_id UUID DEFAULT NULL
)
RETURNS TABLE (
  item_id       TEXT,
  item_name     TEXT,
  required_qty  NUMERIC,
  available_qty NUMERIC,
  missing_qty   NUMERIC,
  unit_abbr     TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  loc_id UUID;
BEGIN
  loc_id := COALESCE(p_location_id,
    (SELECT id FROM public.locations WHERE name = 'Cocina' LIMIT 1)
  );

  RETURN QUERY
  SELECT
    i.id              AS item_id,
    i.name            AS item_name,
    ri.quantity * p_qty AS required_qty,
    COALESCE(sc.quantity, 0) AS available_qty,
    GREATEST(0, ri.quantity * p_qty - COALESCE(sc.quantity, 0)) AS missing_qty,
    u.abbreviation    AS unit_abbr
  FROM public.recipe_items ri
  JOIN public.items i ON i.id = ri.item_id
  JOIN public.units u ON u.id = ri.unit_id
  LEFT JOIN public.stock_current sc
    ON sc.item_id = ri.item_id AND sc.location_id = loc_id
  WHERE ri.recipe_id = p_recipe_id
    AND (ri.quantity * p_qty - COALESCE(sc.quantity, 0)) > 0
  ORDER BY missing_qty DESC;
END;
$$;

-- ----------------------------------------------------------------
-- TABLA: regional_products y regional_stock (Fase 5)
-- ----------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS seq_regional START 1;

CREATE TABLE public.regional_products (
  id          TEXT PRIMARY KEY DEFAULT 'REG-' || LPAD(nextval('seq_regional')::TEXT, 4, '0'),
  name        TEXT NOT NULL,
  category    TEXT NOT NULL, -- dulces, mieles, frutos_secos, aceites
  notes       TEXT,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.regional_stock (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      TEXT NOT NULL REFERENCES public.regional_products(id),
  presentation    TEXT NOT NULL, -- '1kg', '500g', '250g'
  quantity        NUMERIC(8, 2) NOT NULL DEFAULT 0,
  reorder_point   NUMERIC(8, 2) NOT NULL DEFAULT 0,
  price           NUMERIC(10, 2),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, presentation)
);

CREATE TRIGGER regional_stock_updated_at
  BEFORE UPDATE ON public.regional_stock
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados pueden leer recetas" ON public.recipes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados pueden leer ingredientes" ON public.recipe_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados pueden leer producción" ON public.production_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados pueden registrar producción" ON public.production_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados pueden leer productos regionales" ON public.regional_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados pueden leer stock regional" ON public.regional_stock FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins pueden gestionar recetas" ON public.recipes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins pueden gestionar ingredientes" ON public.recipe_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
