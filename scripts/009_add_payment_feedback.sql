-- =============================================================================
-- SETUP: Sistema de Feedback para Pagos
-- =============================================================================
-- Permite trackear cuando usuarios tienen problemas o abandonan el pago
-- =============================================================================

BEGIN;

-- ============================================================================
-- TABLA: payment_feedback
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payment_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_id UUID NOT NULL REFERENCES public.cv_lab_cvs(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,

  -- Feedback
  feedback_type TEXT NOT NULL CHECK (feedback_type IN (
    'PAYMENT_PROBLEM',      -- Problemas al pagar
    'CANCELLED_BY_USER',    -- Usuario canceló
    'TOO_EXPENSIVE',        -- Considera que es caro
    'NO_YAPPY',             -- No tiene Yappy
    'OTHER'                 -- Otro motivo
  )),
  message TEXT,             -- Mensaje opcional del usuario

  -- Metadata
  user_agent TEXT,
  ip_address TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payment_feedback_user_id ON public.payment_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_feedback_cv_id ON public.payment_feedback(cv_id);
CREATE INDEX IF NOT EXISTS idx_payment_feedback_payment_id ON public.payment_feedback(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_feedback_type ON public.payment_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_payment_feedback_created_at ON public.payment_feedback(created_at DESC);

-- ============================================================================
-- RLS POLÍTICAS
-- ============================================================================

ALTER TABLE public.payment_feedback ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden insertar su propio feedback
CREATE POLICY "users_insert_own_feedback"
  ON public.payment_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden ver su propio feedback
CREATE POLICY "users_select_own_feedback"
  ON public.payment_feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Admins pueden ver todo el feedback
CREATE POLICY "admins_select_all_feedback"
  ON public.payment_feedback FOR SELECT
  USING (public.is_admin());

-- Sistema puede insertar feedback
CREATE POLICY "system_insert_feedback"
  ON public.payment_feedback FOR INSERT
  WITH CHECK (true);

COMMIT;

-- =============================================================================
-- SETUP COMPLETADO
-- =============================================================================
-- ✅ Tabla payment_feedback creada
-- ✅ 5 índices creados
-- ✅ 4 políticas RLS aplicadas
-- =============================================================================
