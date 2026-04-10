-- ================================================================
-- MIGRACIÓN 0004: Subsistema de Empanadas
-- Tablas: empanada_flavors, empanada_stock, empanada_movements, empanada_production
-- (Fase 2)
-- ================================================================

-- ----------------------------------------------------------------
-- TABLA: empanada_flavors
-- ----------------------------------------------------------------
CREATE TABLE public.empanada_flavors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        emp_sabor NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.empanada_flavors (code, name, description) VALUES
  ('CARNE',   'Carne',            'Empanada de carne clásica'),
  ('PICANTE', 'Picante',          'Empanada de carne picante'),
  ('POLLO',   'Pollo',            'Empanada de pollo'),
  ('TYQ',     'Tomate y Queso',   'Empanada de tomate y queso'),
  ('JYQ',     'Jamón y Queso',    'Empanada de jamón y queso'),
  ('QCH',     'Queso y Champiñón','Empanada de queso y champiñón'),
  ('HUMITA',  'Humita',           'Empanada de humita');

-- ----------------------------------------------------------------
-- TABLA: empanada_stock
-- Stock por sabor + ubicación en bandejas
-- ----------------------------------------------------------------
CREATE TABLE public.empanada_stock (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flavor_id   UUID NOT NULL REFERENCES public.empanada_flavors(id),
  location    emp_location NOT NULL,
  quantity    NUMERIC(8, 1) NOT NULL DEFAULT 0, -- en bandejas
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(flavor_id, location)
);

CREATE TRIGGER empanada_stock_updated_at
  BEFORE UPDATE ON public.empanada_stock
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Inicializar stock en 0 para cada sabor × ubicación
INSERT INTO public.empanada_stock (flavor_id, location, quantity)
SELECT f.id, loc.location, 0
FROM public.empanada_flavors f
CROSS JOIN (
  VALUES ('BAR'::emp_location), ('FABRICA'::emp_location), ('SAN_MIGUEL'::emp_location)
) AS loc(location);

-- ----------------------------------------------------------------
-- TABLA: empanada_movements (LEDGER — inmutable)
-- ----------------------------------------------------------------
CREATE TABLE public.empanada_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flavor_id       UUID NOT NULL REFERENCES public.empanada_flavors(id),
  location        emp_location NOT NULL,
  type            emp_movement_type NOT NULL,
  quantity        NUMERIC(8, 1) NOT NULL,
  notes           TEXT,
  responsible_id  UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE RULE emp_movements_no_update AS
  ON UPDATE TO public.empanada_movements DO INSTEAD NOTHING;
CREATE OR REPLACE RULE emp_movements_no_delete AS
  ON DELETE TO public.empanada_movements DO INSTEAD NOTHING;

CREATE INDEX idx_emp_movements_flavor ON public.empanada_movements(flavor_id);
CREATE INDEX idx_emp_movements_date ON public.empanada_movements(created_at DESC);

-- Función: actualizar empanada_stock cuando se registra un movimiento
CREATE OR REPLACE FUNCTION public.apply_empanada_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  delta NUMERIC;
BEGIN
  CASE NEW.type
    WHEN 'PRODUCCION' THEN delta := ABS(NEW.quantity);
    WHEN 'VENTA_FINDE' THEN delta := -ABS(NEW.quantity);
    WHEN 'REPOSICION_BAR' THEN delta := NEW.quantity; -- puede ser negativo (sale de fábrica)
    WHEN 'RETIRO' THEN delta := -ABS(NEW.quantity);
    WHEN 'CONSUMICION' THEN delta := -ABS(NEW.quantity);
    ELSE delta := NEW.quantity;
  END CASE;

  INSERT INTO public.empanada_stock (flavor_id, location, quantity)
  VALUES (NEW.flavor_id, NEW.location, delta)
  ON CONFLICT (flavor_id, location)
  DO UPDATE SET
    quantity = public.empanada_stock.quantity + delta,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_empanada_movement_insert
  AFTER INSERT ON public.empanada_movements
  FOR EACH ROW EXECUTE FUNCTION public.apply_empanada_movement();

-- ----------------------------------------------------------------
-- TABLA: empanada_production
-- Registro de producción por lote
-- ----------------------------------------------------------------
CREATE TABLE public.empanada_production (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_date DATE NOT NULL DEFAULT CURRENT_DATE,
  flavor_id       UUID NOT NULL REFERENCES public.empanada_flavors(id),
  quantity        NUMERIC(8, 1) NOT NULL, -- en bandejas
  source_location emp_location NOT NULL DEFAULT 'FABRICA',
  notes           TEXT,
  registered_by   UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Al registrar producción → insertar movimiento tipo PRODUCCION en FABRICA
CREATE OR REPLACE FUNCTION public.handle_empanada_production()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.empanada_movements (
    flavor_id, location, type, quantity, notes, responsible_id
  ) VALUES (
    NEW.flavor_id,
    NEW.source_location,
    'PRODUCCION',
    NEW.quantity,
    'Producción registrada: ' || COALESCE(NEW.notes, ''),
    NEW.registered_by
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_empanada_production_insert
  AFTER INSERT ON public.empanada_production
  FOR EACH ROW EXECUTE FUNCTION public.handle_empanada_production();

CREATE INDEX idx_emp_production_date ON public.empanada_production(production_date DESC);

-- ----------------------------------------------------------------
-- VISTA: stock actual de empanadas por ubicación
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_empanada_stock_summary AS
SELECT
  f.code    AS sabor_code,
  f.name    AS sabor_nombre,
  es.location,
  es.quantity,
  es.updated_at
FROM public.empanada_stock es
JOIN public.empanada_flavors f ON f.id = es.flavor_id
WHERE f.active = true
ORDER BY f.code, es.location;

-- ----------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------
ALTER TABLE public.empanada_flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empanada_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empanada_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empanada_production ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados pueden leer sabores" ON public.empanada_flavors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados pueden leer stock empanadas" ON public.empanada_stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados pueden leer movimientos empanadas" ON public.empanada_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados pueden leer producción empanadas" ON public.empanada_production FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados pueden registrar movimientos empanadas" ON public.empanada_movements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados pueden registrar producción empanadas" ON public.empanada_production FOR INSERT TO authenticated WITH CHECK (true);
