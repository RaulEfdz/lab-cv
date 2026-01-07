-- =============================================================================
-- SETUP: Sistema de Pagos con Yappy para Lab CV
-- =============================================================================
-- Modelo de negocio: Pago único de $2.00 por descarga de CV
-- Método de pago: Yappy (Banco General de Panamá)
-- =============================================================================

BEGIN;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE payment_status AS ENUM (
  'PENDING',              -- Pago iniciado, esperando confirmación
  'COMPLETED',            -- Pago completado exitosamente
  'FAILED',               -- Pago fallido/rechazado
  'CANCELLED',            -- Cancelado por usuario
  'EXPIRED'               -- Expirado (no confirmado en 24h)
);

CREATE TYPE payment_method AS ENUM (
  'YAPPY',                -- Sistema Yappy
  'CARD',                 -- Tarjeta (futuro)
  'TRANSFER'              -- Transferencia (futuro)
);

CREATE TYPE payment_event AS ENUM (
  'MERCHANT_VALIDATE_REQUEST',
  'MERCHANT_VALIDATE_SUCCESS',
  'MERCHANT_VALIDATE_ERROR',
  'ORDER_CREATE_REQUEST',
  'ORDER_CREATE_SUCCESS',
  'ORDER_CREATE_ERROR',
  'IPN_RECEIVED',
  'IPN_VALIDATED',
  'IPN_INVALID',
  'IPN_PROCESSED',
  'PAYMENT_PENDING',
  'PAYMENT_COMPLETED',
  'PAYMENT_FAILED',
  'PAYMENT_CANCELLED',
  'PAYMENT_EXPIRED',
  'DOWNLOAD_ACCESS_GRANTED',
  'DOWNLOAD_ACCESS_REVOKED'
);

CREATE TYPE log_status AS ENUM (
  'INFO',
  'SUCCESS',
  'WARNING',
  'ERROR'
);

-- ============================================================================
-- TABLA: payments
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_id UUID NOT NULL REFERENCES public.cv_lab_cvs(id) ON DELETE CASCADE,

  -- Detalles del pago
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'PENDING',

  -- Método de pago
  payment_method payment_method NOT NULL DEFAULT 'YAPPY',
  external_id TEXT,  -- Order ID de Yappy
  transaction_id TEXT,  -- Transaction ID de Yappy

  -- Metadatos de Yappy
  yappy_phone TEXT,  -- Número usado para pagar
  yappy_confirmation_number TEXT,
  yappy_status_code TEXT,  -- E/R/C/X

  -- Control de verificación (24h de gracia)
  verification_deadline TIMESTAMPTZ,
  granted_access BOOLEAN DEFAULT false,  -- Acceso temporal otorgado

  -- Timestamps de estado
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,

  -- Auditoría
  previous_status payment_status,
  status_changed_at TIMESTAMPTZ,
  status_change_note TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_cv_id ON public.payments(cv_id);
CREATE INDEX idx_payments_external_id ON public.payments(external_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);

-- ============================================================================
-- TABLA: cv_download_access
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cv_download_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  cv_id UUID NOT NULL REFERENCES public.cv_lab_cvs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,

  -- Estado del acceso
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),

  -- Contadores
  download_count INT DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: Un usuario solo puede tener un acceso activo por CV
  CONSTRAINT unique_user_cv_access UNIQUE(cv_id, user_id)
);

-- Índices
CREATE INDEX idx_download_access_user_id ON public.cv_download_access(user_id);
CREATE INDEX idx_download_access_cv_id ON public.cv_download_access(cv_id);
CREATE INDEX idx_download_access_payment_id ON public.cv_download_access(payment_id);

-- ============================================================================
-- TABLA: payment_logs (Auditoría)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificadores
  event payment_event NOT NULL,
  provider TEXT NOT NULL DEFAULT 'YAPPY',
  status log_status NOT NULL,

  -- Relaciones opcionales
  user_id UUID REFERENCES auth.users(id),
  payment_id UUID REFERENCES public.payments(id),
  cv_id UUID REFERENCES public.cv_lab_cvs(id),

  -- Detalles de la transacción
  order_id TEXT,
  transaction_id TEXT,
  amount DECIMAL(10,2),

  -- Request/Response
  request_data JSONB,
  response_data JSONB,
  error_code TEXT,
  error_message TEXT,

  -- Información de la petición
  ip_address TEXT,
  user_agent TEXT,

  -- Metadata adicional
  metadata JSONB,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para análisis
CREATE INDEX idx_payment_logs_user_id ON public.payment_logs(user_id);
CREATE INDEX idx_payment_logs_payment_id ON public.payment_logs(payment_id);
CREATE INDEX idx_payment_logs_event ON public.payment_logs(event);
CREATE INDEX idx_payment_logs_status ON public.payment_logs(status);
CREATE INDEX idx_payment_logs_created_at ON public.payment_logs(created_at DESC);
CREATE INDEX idx_payment_logs_order_id ON public.payment_logs(order_id);

-- ============================================================================
-- FUNCIÓN: Updated At (si no existe)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS: Updated At
-- ============================================================================

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_download_access_updated_at ON public.cv_download_access;
CREATE TRIGGER update_download_access_updated_at
  BEFORE UPDATE ON public.cv_download_access
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- POLÍTICAS RLS
-- ============================================================================

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_download_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- Payments: Usuarios ven solo sus propios pagos
CREATE POLICY "users_select_own_payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- Payments: Admins ven todos los pagos
CREATE POLICY "admins_select_all_payments"
  ON public.payments FOR SELECT
  USING (public.is_admin());

-- Payments: Usuarios crean pagos para sí mismos
CREATE POLICY "users_insert_own_payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Payments: Admins pueden modificar todos los pagos
CREATE POLICY "admins_update_all_payments"
  ON public.payments FOR UPDATE
  USING (public.is_admin());

-- Download Access: Usuarios ven solo su propio acceso
CREATE POLICY "users_select_own_download_access"
  ON public.cv_download_access FOR SELECT
  USING (auth.uid() = user_id);

-- Download Access: Admins ven todos los accesos
CREATE POLICY "admins_select_all_download_access"
  ON public.cv_download_access FOR SELECT
  USING (public.is_admin());

-- Download Access: Sistema crea accesos (via service role)
CREATE POLICY "system_insert_download_access"
  ON public.cv_download_access FOR INSERT
  WITH CHECK (true);

-- Download Access: Sistema actualiza accesos (via service role)
CREATE POLICY "system_update_download_access"
  ON public.cv_download_access FOR UPDATE
  USING (true);

-- Payment Logs: Solo admins leen logs
CREATE POLICY "admins_select_payment_logs"
  ON public.payment_logs FOR SELECT
  USING (public.is_admin());

-- Payment Logs: Sistema inserta logs
CREATE POLICY "system_insert_payment_logs"
  ON public.payment_logs FOR INSERT
  WITH CHECK (true);

COMMIT;

-- =============================================================================
-- SETUP COMPLETADO
-- =============================================================================
-- ✅ Enums creados (payment_status, payment_method, payment_event, log_status)
-- ✅ Tabla payments creada (con auditoría completa)
-- ✅ Tabla cv_download_access creada (control de accesos)
-- ✅ Tabla payment_logs creada (logging de eventos)
-- ✅ Triggers de updated_at configurados
-- ✅ Políticas RLS aplicadas (usuarios/admins/sistema)
-- =============================================================================
