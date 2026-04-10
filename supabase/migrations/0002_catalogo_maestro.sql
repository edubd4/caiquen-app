-- ================================================================
-- MIGRACIÓN 0002: Catálogo Maestro
-- Tablas: categories, units, suppliers, items, locations
-- (Fase 1 — Sesión 1.1)
-- ================================================================

-- ----------------------------------------------------------------
-- Función: generar IDs legibles estilo ELC-0001
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_readable_id(prefix TEXT, table_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_val  BIGINT;
  padded    TEXT;
BEGIN
  -- Usa una secuencia por tabla
  EXECUTE format('SELECT nextval(%L)', 'seq_' || table_name)
  INTO next_val;
  padded := LPAD(next_val::TEXT, 4, '0');
  RETURN prefix || '-' || padded;
END;
$$;

-- Secuencias para IDs legibles
CREATE SEQUENCE IF NOT EXISTS seq_items START 1;
CREATE SEQUENCE IF NOT EXISTS seq_suppliers START 1;

-- ----------------------------------------------------------------
-- TABLA: categories
-- ----------------------------------------------------------------
CREATE TABLE public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  color       TEXT DEFAULT '#e8a020', -- color hex para UI
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categorías iniciales de El Caiquen
INSERT INTO public.categories (name, description, color) VALUES
  ('Verdura', 'Frutas y verduras frescas', '#22c97a'),
  ('Mercadería', 'Artículos de almacén', '#4a9eff'),
  ('Carnes y derivados', 'Carnes, pollo, fiambres y embutidos', '#e85a5a'),
  ('Bebidas', 'Vinos, cervezas, gaseosas y aguas', '#a855f7'),
  ('Pastas y panadería', 'Pastas, pan y masas', '#f97316'),
  ('Postres y dulces', 'Postres y preparaciones dulces', '#ec4899'),
  ('Condimentos', 'Especias, condimentos y salsas', '#eab308'),
  ('Limpieza', 'Productos de limpieza', '#06b6d4'),
  ('Descartables', 'Elementos descartables y empaques', '#84cc16'),
  ('Empanadas', 'Insumos específicos para empanadas', '#e8a020');

-- ----------------------------------------------------------------
-- TABLA: units
-- ----------------------------------------------------------------
CREATE TABLE public.units (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  abbreviation  TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unidades de El Caiquen
INSERT INTO public.units (name, abbreviation) VALUES
  ('Kilogramo', 'kg'),
  ('Litro', 'lt'),
  ('Unidad', 'u'),
  ('Cajón', 'cajón'),
  ('Bolsa', 'bolsa'),
  ('Bandeja', 'bandeja'),
  ('Atado', 'atado'),
  ('Gramo', 'g'),
  ('Mililitro', 'ml'),
  ('Docena', 'doc');

-- ----------------------------------------------------------------
-- TABLA: suppliers
-- ----------------------------------------------------------------
CREATE TABLE public.suppliers (
  id          TEXT PRIMARY KEY DEFAULT 'PRV-' || LPAD(nextval('seq_suppliers')::TEXT, 4, '0'),
  name        TEXT NOT NULL,
  contact     TEXT,
  phone       TEXT,
  notes       TEXT,
  deleted_at  TIMESTAMPTZ, -- soft delete
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Proveedores iniciales de El Caiquen
INSERT INTO public.suppliers (name, notes) VALUES
  ('Fidenza', 'Proveedor de mercadería general'),
  ('Rodolfo Rabi', 'Proveedor de carnes'),
  ('Soychu', 'Proveedor de verduras y frutas'),
  ('Mercado', 'Compras en mercado local'),
  ('Mayorista', 'Compras en mayorista');

-- ----------------------------------------------------------------
-- TABLA: items (catálogo maestro)
-- FUENTE ÚNICA DE VERDAD para todos los insumos
-- ----------------------------------------------------------------
CREATE TABLE public.items (
  id          TEXT PRIMARY KEY DEFAULT 'ELC-' || LPAD(nextval('seq_items')::TEXT, 4, '0'),
  item_code   TEXT NOT NULL UNIQUE, -- ej: cebolla_kg, carne_picada_kg
  name        TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  unit_id     UUID NOT NULL REFERENCES public.units(id),
  supplier_id TEXT REFERENCES public.suppliers(id),
  notes       TEXT,
  deleted_at  TIMESTAMPTZ, -- soft delete
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_items_category ON public.items(category_id);
CREATE INDEX idx_items_supplier ON public.items(supplier_id);
CREATE INDEX idx_items_code ON public.items(item_code);

-- ----------------------------------------------------------------
-- TABLA: locations
-- Ubicaciones físicas de stock
-- ----------------------------------------------------------------
CREATE TABLE public.locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.locations (name, description) VALUES
  ('Cocina', 'Depósito principal de cocina'),
  ('Bar', 'Stock del bar'),
  ('Depósito', 'Depósito general'),
  ('Fábrica de Empanadas', 'Área de producción de empanadas'),
  ('San Miguel', 'Puesto de San Miguel');

-- ----------------------------------------------------------------
-- TABLA: stock_current
-- Stock actual por ítem + ubicación
-- ----------------------------------------------------------------
CREATE TABLE public.stock_current (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         TEXT NOT NULL REFERENCES public.items(id),
  location_id     UUID NOT NULL REFERENCES public.locations(id),
  quantity        NUMERIC(10, 3) NOT NULL DEFAULT 0,
  reorder_point   NUMERIC(10, 3) NOT NULL DEFAULT 0,
  last_count_at   TIMESTAMPTZ,
  counted_by      UUID REFERENCES auth.users(id),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(item_id, location_id)
);

CREATE TRIGGER stock_current_updated_at
  BEFORE UPDATE ON public.stock_current
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_stock_current_item ON public.stock_current(item_id);
CREATE INDEX idx_stock_current_location ON public.stock_current(location_id);

-- ----------------------------------------------------------------
-- TABLA: stock_movements (LEDGER — INMUTABLE)
-- Cada cambio de stock queda registrado aquí para siempre
-- ----------------------------------------------------------------
CREATE TABLE public.stock_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         TEXT NOT NULL REFERENCES public.items(id),
  location_id     UUID NOT NULL REFERENCES public.locations(id),
  type            stock_movement_type NOT NULL,
  quantity        NUMERIC(10, 3) NOT NULL, -- positivo = entrada, negativo = salida
  reason          TEXT,
  responsible_id  UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inmutable: sin UPDATE ni DELETE
CREATE OR REPLACE RULE stock_movements_no_update AS
  ON UPDATE TO public.stock_movements DO INSTEAD NOTHING;
CREATE OR REPLACE RULE stock_movements_no_delete AS
  ON DELETE TO public.stock_movements DO INSTEAD NOTHING;

CREATE INDEX idx_stock_movements_item ON public.stock_movements(item_id);
CREATE INDEX idx_stock_movements_date ON public.stock_movements(created_at DESC);
CREATE INDEX idx_stock_movements_type ON public.stock_movements(type);

-- Función: actualizar stock_current cuando se inserta un movimiento
CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  delta NUMERIC;
BEGIN
  -- Calcular delta según tipo de movimiento
  CASE NEW.type
    WHEN 'ENTRADA' THEN delta := ABS(NEW.quantity);
    WHEN 'SALIDA' THEN delta := -ABS(NEW.quantity);
    WHEN 'MERMA' THEN delta := -ABS(NEW.quantity);
    WHEN 'AJUSTE' THEN delta := NEW.quantity; -- puede ser positivo o negativo
    WHEN 'TRANSFERENCIA' THEN delta := NEW.quantity; -- positivo = llega, negativo = sale
    ELSE delta := NEW.quantity;
  END CASE;

  -- Upsert en stock_current
  INSERT INTO public.stock_current (item_id, location_id, quantity)
  VALUES (NEW.item_id, NEW.location_id, delta)
  ON CONFLICT (item_id, location_id)
  DO UPDATE SET
    quantity = public.stock_current.quantity + delta,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_stock_movement_insert
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();

-- ----------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------

-- categories, units, locations (lectura para todos, escritura solo admin)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_current ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Política genérica: autenticados pueden leer, admins pueden escribir
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['categories', 'units', 'locations', 'suppliers', 'items', 'stock_current']
  LOOP
    EXECUTE format('
      CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true);
    ', t || '_select', t);
  END LOOP;
END;
$$;

-- stock_movements: todos los autenticados pueden insertar
CREATE POLICY "Autenticados pueden leer movimientos"
  ON public.stock_movements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados pueden registrar movimientos"
  ON public.stock_movements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- items: solo admins pueden crear/modificar
CREATE POLICY "Admins pueden gestionar items"
  ON public.items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- suppliers: solo admins
CREATE POLICY "Admins pueden gestionar suppliers"
  ON public.suppliers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
