-- ================================================================
-- MIGRACIÓN 0003: Personal y Nómina
-- Tablas: job_positions, employees, shifts, payroll_periods, payroll_advances
-- (Fase 3)
-- ================================================================

CREATE SEQUENCE IF NOT EXISTS seq_employees START 1;

-- ----------------------------------------------------------------
-- TABLA: job_positions
-- Puestos de trabajo del restaurante
-- ----------------------------------------------------------------
CREATE TABLE public.job_positions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Puestos identificados en las planillas de El Caiquen
INSERT INTO public.job_positions (name, description) VALUES
  ('Encargado General', 'Control total de operaciones, stock, personal y producción'),
  ('Supervisor de Cocina', 'Supervisión de cocina, producción y planillas'),
  ('Supervisor de Salón', 'Supervisión de mozos y atención al cliente'),
  ('Hornero', 'Manejo del horno de leña, producción y despacho de empanadas'),
  ('Auxiliar de Hornero', 'Asistencia al hornero'),
  ('Parrillero', 'Manejo de parrilla y preparación de carnes'),
  ('Auxiliar de Parrillero', 'Asistencia al parrillero'),
  ('Cocinero', 'Preparación de platos principales, locro, humita, milanesas'),
  ('Auxiliar de Cocina', 'Picado de verduras, ensaladas, entradas, mise en place'),
  ('Auxiliar de Limpieza', 'Limpieza de baños, vajilla, cocina y salón'),
  ('Mozo', 'Atención a las mesas, toma de pedidos, servicio'),
  ('Raner', 'Acomodador de mesas y asistencia a mozos'),
  ('Cajero', 'Apertura de arqueo, cobro, pagos al personal');

-- ----------------------------------------------------------------
-- TABLA: employees
-- ----------------------------------------------------------------
CREATE TABLE public.employees (
  id            TEXT PRIMARY KEY DEFAULT 'EMP-' || LPAD(nextval('seq_employees')::TEXT, 4, '0'),
  full_name     TEXT NOT NULL,
  position_id   UUID NOT NULL REFERENCES public.job_positions(id),
  base_salary   NUMERIC(12, 2) NOT NULL DEFAULT 0, -- sueldo base semanal
  phone         TEXT,
  notes         TEXT,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_employees_position ON public.employees(position_id);

-- ----------------------------------------------------------------
-- TABLA: shifts
-- Registro diario de entrada/salida
-- ----------------------------------------------------------------
CREATE TABLE public.shifts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   TEXT NOT NULL REFERENCES public.employees(id),
  date          DATE NOT NULL,
  time_in       TIME,
  time_out      TIME,
  hours_worked  NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE
      WHEN time_in IS NOT NULL AND time_out IS NOT NULL
      THEN EXTRACT(EPOCH FROM (time_out - time_in)) / 3600.0
      ELSE NULL
    END
  ) STORED,
  notes         TEXT,
  registered_by UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

CREATE INDEX idx_shifts_employee ON public.shifts(employee_id);
CREATE INDEX idx_shifts_date ON public.shifts(date DESC);

-- ----------------------------------------------------------------
-- TABLA: payroll_periods
-- Períodos semanales de pago
-- ----------------------------------------------------------------
CREATE TABLE public.payroll_periods (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start  DATE NOT NULL,
  week_end    DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'ABIERTO' CHECK (status IN ('ABIERTO', 'CERRADO', 'PAGADO')),
  notes       TEXT,
  closed_by   UUID REFERENCES auth.users(id),
  closed_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(week_start)
);

-- ----------------------------------------------------------------
-- TABLA: payroll_advances
-- Retiros y adelantos de sueldo
-- (reemplaza la sección RETIROS/DINERO de la planilla actual)
-- ----------------------------------------------------------------
CREATE TABLE public.payroll_advances (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   TEXT NOT NULL REFERENCES public.employees(id),
  period_id     UUID REFERENCES public.payroll_periods(id),
  amount        NUMERIC(12, 2) NOT NULL, -- negativo = retiro/adelanto
  reason        TEXT,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  registered_by UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_advances_employee ON public.payroll_advances(employee_id);
CREATE INDEX idx_advances_period ON public.payroll_advances(period_id);

-- ----------------------------------------------------------------
-- VISTA: nómina semanal calculada
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_payroll_summary AS
SELECT
  e.id                AS employee_id,
  e.full_name,
  jp.name             AS position,
  e.base_salary,
  pp.id               AS period_id,
  pp.week_start,
  pp.week_end,
  pp.status           AS period_status,
  COALESCE(SUM(s.hours_worked), 0)  AS total_hours,
  -- Sueldo calculado proporcional a horas (base / 40h semana estándar)
  ROUND(
    e.base_salary * COALESCE(SUM(s.hours_worked), 0) / 40.0, 2
  ) AS earned_salary,
  COALESCE(SUM(pa.amount), 0) AS total_advances,
  ROUND(
    e.base_salary * COALESCE(SUM(s.hours_worked), 0) / 40.0
    + COALESCE(SUM(pa.amount), 0),
    2
  ) AS net_payable
FROM public.employees e
JOIN public.job_positions jp ON e.position_id = jp.id
CROSS JOIN public.payroll_periods pp
LEFT JOIN public.shifts s
  ON s.employee_id = e.id
  AND s.date BETWEEN pp.week_start AND pp.week_end
LEFT JOIN public.payroll_advances pa
  ON pa.employee_id = e.id
  AND pa.period_id = pp.id
WHERE e.deleted_at IS NULL
GROUP BY e.id, e.full_name, jp.name, e.base_salary, pp.id, pp.week_start, pp.week_end, pp.status;

-- ----------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------
ALTER TABLE public.job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_advances ENABLE ROW LEVEL SECURITY;

-- Lectura para todos los autenticados
CREATE POLICY "Autenticados pueden leer puestos" ON public.job_positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados pueden leer empleados" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados pueden leer turnos" ON public.shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados pueden leer períodos" ON public.payroll_periods FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados pueden leer adelantos" ON public.payroll_advances FOR SELECT TO authenticated USING (true);

-- Escritura solo admins (empleados + turnos pueden ser registrados por todos)
CREATE POLICY "Autenticados pueden registrar turnos" ON public.shifts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins pueden gestionar empleados" ON public.employees FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins pueden gestionar períodos" ON public.payroll_periods FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins pueden registrar adelantos" ON public.payroll_advances FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
