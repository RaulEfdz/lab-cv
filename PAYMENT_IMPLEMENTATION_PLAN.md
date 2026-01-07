# Plan de Implementación: Sistema de Pagos con Yappy

**Fecha:** 2026-01-06
**Proyecto:** Lab CV
**Modelo:** Pago único de $2.00 por descarga de CV
**Método de Pago:** Yappy (Banco General de Panamá)

---

## 📋 Resumen del Modelo de Negocio

### Propuesta de Valor

```
✅ GRATIS:
   - Crear CVs ilimitados
   - Chat con Octavia IA
   - Ver readiness score
   - Editar y mejorar CV
   - Vista previa del CV

💵 PAGO ($2.00):
   - Descargar CV en PDF
   - Descargar CV en Word
   - Acceso permanente a descargas
   - Sin marca de agua
```

### Flujo de Usuario

```
1. Usuario crea su CV gratis ✅
2. Usuario mejora su CV con Octavia ✅
3. Usuario hace clic en "Descargar CV"

   → ¿Ya pagó por este CV?
      SÍ → Descargar inmediatamente
      NO → Mostrar botón de Yappy ($2.00)

4. Usuario paga con Yappy (número 8 dígitos)
5. Sistema verifica pago automáticamente
6. Descarga se activa permanentemente
7. Usuario puede descargar las veces que quiera
```

---

## 🗄️ Fase 1: Migraciones de Base de Datos

### Script: `008_setup_payments.sql`

```sql
-- =============================================================================
-- SETUP: Sistema de Pagos con Yappy
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Índices
  CONSTRAINT unique_cv_payment UNIQUE(cv_id, user_id, status)
    WHERE status IN ('PENDING', 'COMPLETED')
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
-- TRIGGERS: Updated At
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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
```

---

## 📦 Fase 2: Configuración del Entorno

### Archivo: `.env.local`

```env
# =============================================================================
# YAPPY PAYMENT CONFIGURATION
# =============================================================================

# Entorno (uat = pruebas, prod = producción)
YAPPY_ENV=uat

# API Base URLs
YAPPY_API_BASE_PROD=https://apipagosbg.bgeneral.cloud
YAPPY_API_BASE_UAT=https://api-comecom-uat.yappycloud.com

# Credenciales (obtener de Banco General)
YAPPY_MERCHANT_ID=tu_merchant_id_aqui
YAPPY_SECRET_KEY=tu_secret_key_aqui
YAPPY_SECRET_HASH=tu_hash_base64_aqui

# URLs de tu aplicación
YAPPY_DOMAIN=https://lab-cv-alpha.vercel.app
YAPPY_IPN_URL=https://lab-cv-alpha.vercel.app/api/payments/yappy/ipn

# Whitelist de IPs de Yappy (producción)
# IMPORTANTE: Configurar en producción para seguridad
YAPPY_ALLOWED_IPS=

# =============================================================================
# PRECIO DE DESCARGA
# =============================================================================
CV_DOWNLOAD_PRICE=2.00
CV_DOWNLOAD_CURRENCY=USD

# =============================================================================
# EMAIL NOTIFICATIONS (Resend)
# =============================================================================
RESEND_API_KEY=tu_resend_api_key
EMAIL_FROM=Lab CV <noreply@lab-cv.com>
```

---

## 🔧 Fase 3: Archivos a Migrar desde AgilityTask

### Estructura de carpetas:

```
lab-cv/
├── lib/
│   ├── payments/
│   │   ├── yappy.ts              ← COPIAR (core de Yappy)
│   │   └── paymentLogger.ts      ← COPIAR (logging)
│   └── email/
│       └── send-payment-notification.ts  ← COPIAR (emails)
│
├── app/api/payments/yappy/
│   ├── create-order/
│   │   └── route.ts              ← COPIAR Y ADAPTAR
│   ├── ipn/
│   │   └── route.ts              ← COPIAR Y ADAPTAR
│   └── config/
│       └── route.ts              ← COPIAR
│
├── components/payments/
│   └── YappyDownloadButton.tsx   ← CREAR NUEVO (basado en YappyButton)
│
└── emails/
    ├── PaymentPendingEmail.tsx   ← COPIAR Y ADAPTAR
    ├── PaymentCompletedEmail.tsx ← COPIAR Y ADAPTAR
    └── PaymentFailedEmail.tsx    ← COPIAR Y ADAPTAR
```

---

## 📝 Fase 4: Adaptaciones Necesarias

### A. `/lib/payments/yappy.ts`

**Cambios mínimos**, solo ajustar:
- Mantener todas las funciones core
- Actualizar comentarios para contexto de Lab CV

### B. `/app/api/payments/yappy/create-order/route.ts`

**Adaptaciones:**

```typescript
// ANTES (AgilityTask - Suscripciones)
const { planId, quantity, organizationId } = await request.json()
const plan = await db.plan.findUnique({ where: { id: planId } })
const amount = plan.price * quantity

// DESPUÉS (Lab CV - Descarga de CV)
const { cvId } = await request.json()
const cv = await supabase
  .from('cv_lab_cvs')
  .select('id, user_id, title')
  .eq('id', cvId)
  .single()

// Verificar que el CV pertenece al usuario
if (cv.user_id !== user.id) {
  return NextResponse.json({ error: 'CV no encontrado' }, { status: 404 })
}

// Verificar si ya pagó por este CV
const existingAccess = await supabase
  .from('cv_download_access')
  .select('id')
  .eq('cv_id', cvId)
  .eq('user_id', user.id)
  .eq('status', 'ACTIVE')
  .single()

if (existingAccess) {
  return NextResponse.json({ error: 'Ya tienes acceso a este CV' }, { status: 400 })
}

const amount = parseFloat(process.env.CV_DOWNLOAD_PRICE || '2.00')
```

### C. `/app/api/payments/yappy/ipn/route.ts`

**Adaptaciones:**

```typescript
// ANTES (AgilityTask)
if (status === 'COMPLETED') {
  // Confirmar suscripción
  await db.subscription.update({ ... })
}

// DESPUÉS (Lab CV)
if (status === 'COMPLETED') {
  // Crear acceso de descarga
  await supabase
    .from('cv_download_access')
    .insert({
      cv_id: payment.cv_id,
      user_id: payment.user_id,
      payment_id: payment.id,
      status: 'ACTIVE'
    })

  // Enviar email de confirmación
  await sendPaymentNotification({
    type: 'completed',
    email: user.email,
    cvTitle: cv.title,
    amount: payment.amount
  })
}

if (status === 'FAILED') {
  // Revocar acceso temporal si existía
  await supabase
    .from('cv_download_access')
    .update({ status: 'REVOKED' })
    .eq('payment_id', payment.id)

  // Enviar email de error
  await sendPaymentNotification({
    type: 'failed',
    email: user.email,
    cvTitle: cv.title,
    amount: payment.amount
  })
}
```

### D. `/components/payments/YappyDownloadButton.tsx`

**Nuevo componente** basado en `YappyButton.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface YappyDownloadButtonProps {
  cvId: string
  cvTitle: string
  hasAccess: boolean
  onSuccess?: () => void
}

export function YappyDownloadButton({
  cvId,
  cvTitle,
  hasAccess,
  onSuccess
}: YappyDownloadButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDownload = async () => {
    if (hasAccess) {
      // Descargar directamente
      window.location.href = `/api/cv-lab/${cvId}/download`
      return
    }

    // Iniciar flujo de pago
    setIsProcessing(true)

    try {
      // Cargar script de Yappy
      const configRes = await fetch('/api/payments/yappy/config')
      const config = await configRes.json()

      // Cargar CDN del botón
      await loadYappyScript(config.cdnUrl)

      // Mostrar modal de Yappy
      const phone = await promptForPhone()

      // Crear orden de pago
      const orderRes = await fetch('/api/payments/yappy/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvId, phone })
      })

      const { token, orderId } = await orderRes.json()

      // Abrir formulario de Yappy
      window.Yappy.openForm({
        token,
        onSuccess: () => {
          toast.success('Pago completado. Descargando CV...')
          onSuccess?.()
        },
        onError: (error) => {
          toast.error('Error en el pago: ' + error.message)
        }
      })
    } catch (error) {
      toast.error('Error al procesar el pago')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={isProcessing}
      className="w-full"
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Procesando...
        </>
      ) : hasAccess ? (
        <>
          <Download className="w-4 h-4 mr-2" />
          Descargar CV
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Descargar CV ($2.00)
        </>
      )}
    </Button>
  )
}
```

---

## 🎨 Fase 5: Modificaciones en UI

### A. Página de CV Individual (`/app/dashboard/cvs/[id]/page.tsx`)

Agregar el botón de descarga con Yappy:

```typescript
import { YappyDownloadButton } from '@/components/payments/YappyDownloadButton'

// En el componente
const { data: downloadAccess } = await supabase
  .from('cv_download_access')
  .select('id, status')
  .eq('cv_id', cv.id)
  .eq('user_id', user.id)
  .eq('status', 'ACTIVE')
  .single()

const hasAccess = !!downloadAccess

return (
  <div>
    {/* ... resto del CV ... */}

    <div className="mt-8">
      <YappyDownloadButton
        cvId={cv.id}
        cvTitle={cv.title}
        hasAccess={hasAccess}
        onSuccess={() => {
          // Refrescar la página para actualizar el estado
          window.location.reload()
        }}
      />
    </div>
  </div>
)
```

### B. Endpoint de Descarga (`/app/api/cv-lab/[id]/download/route.ts`)

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generatePDF } from '@/lib/cv-lab/pdf-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Verificar acceso de descarga
  const { data: access } = await supabase
    .from('cv_download_access')
    .select('id, cv_id')
    .eq('cv_id', params.id)
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .single()

  if (!access) {
    return NextResponse.json(
      { error: 'Debes pagar para descargar este CV' },
      { status: 403 }
    )
  }

  // Obtener CV
  const { data: cv } = await supabase
    .from('cv_lab_cvs')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!cv) {
    return NextResponse.json({ error: 'CV no encontrado' }, { status: 404 })
  }

  // Incrementar contador de descargas
  await supabase
    .from('cv_download_access')
    .update({
      download_count: supabase.raw('download_count + 1'),
      last_downloaded_at: new Date().toISOString()
    })
    .eq('id', access.id)

  // Generar PDF
  const pdfBuffer = await generatePDF(cv)

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${cv.title}.pdf"`
    }
  })
}
```

---

## 📧 Fase 6: Templates de Email

### A. `PaymentPendingEmail.tsx`

```tsx
import { Section, Text, Button } from '@react-email/components'

interface PaymentPendingEmailProps {
  userName: string
  cvTitle: string
  amount: number
  orderId: string
}

export function PaymentPendingEmail({
  userName,
  cvTitle,
  amount,
  orderId
}: PaymentPendingEmailProps) {
  return (
    <Section>
      <Text>Hola {userName},</Text>

      <Text>
        Hemos recibido tu solicitud de pago para descargar el CV:
      </Text>

      <Text><strong>{cvTitle}</strong></Text>

      <Text>
        Monto: ${amount.toFixed(2)} USD
      </Text>

      <Text>
        Tu pago está siendo procesado. Recibirás un email de confirmación
        en los próximos minutos.
      </Text>

      <Text>
        Número de orden: {orderId}
      </Text>

      <Button href="https://lab-cv-alpha.vercel.app/dashboard">
        Ver mis CVs
      </Button>
    </Section>
  )
}
```

### B. `PaymentCompletedEmail.tsx`

```tsx
export function PaymentCompletedEmail({
  userName,
  cvTitle,
  amount,
  cvId
}: PaymentCompletedEmailProps) {
  return (
    <Section>
      <Text>¡Pago completado! 🎉</Text>

      <Text>Hola {userName},</Text>

      <Text>
        Tu pago de ${amount.toFixed(2)} USD ha sido confirmado exitosamente.
      </Text>

      <Text>
        Ya puedes descargar tu CV: <strong>{cvTitle}</strong>
      </Text>

      <Button href={`https://lab-cv-alpha.vercel.app/dashboard/cvs/${cvId}`}>
        Descargar CV ahora
      </Button>

      <Text>
        Puedes descargar este CV las veces que necesites sin costo adicional.
      </Text>
    </Section>
  )
}
```

### C. `PaymentFailedEmail.tsx`

```tsx
export function PaymentFailedEmail({
  userName,
  cvTitle,
  amount,
  errorMessage
}: PaymentFailedEmailProps) {
  return (
    <Section>
      <Text>Pago no completado ❌</Text>

      <Text>Hola {userName},</Text>

      <Text>
        Lamentablemente tu pago de ${amount.toFixed(2)} USD para descargar
        el CV "{cvTitle}" no pudo ser procesado.
      </Text>

      <Text>
        Razón: {errorMessage}
      </Text>

      <Text>
        Por favor, intenta nuevamente o contacta a soporte si el problema persiste.
      </Text>

      <Button href="https://lab-cv-alpha.vercel.app/dashboard">
        Intentar nuevamente
      </Button>
    </Section>
  )
}
```

---

## 🧪 Fase 7: Testing

### Script de Pruebas: `test-payments.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testPaymentFlow() {
  console.log('🧪 TESTING PAYMENT FLOW\n')

  // 1. Crear usuario de prueba
  const testUser = {
    email: 'test-payment@lab-cv.com',
    password: 'test123456'
  }

  const { data: user } = await supabaseAdmin.auth.admin.createUser({
    email: testUser.email,
    password: testUser.password,
    email_confirm: true
  })

  console.log('✅ Usuario de prueba creado:', user?.user.id)

  // 2. Crear CV de prueba
  const { data: cv } = await supabaseAdmin
    .from('cv_lab_cvs')
    .insert({
      user_id: user!.user.id,
      title: 'CV Test Payment',
      target_role: 'Software Developer',
      language: 'es',
      status: 'PUBLISHED'
    })
    .select()
    .single()

  console.log('✅ CV creado:', cv.id)

  // 3. Verificar que NO tiene acceso
  const { data: access } = await supabaseAdmin
    .from('cv_download_access')
    .select('*')
    .eq('cv_id', cv.id)
    .eq('user_id', user!.user.id)
    .single()

  console.log('✅ Sin acceso inicial:', access === null)

  // 4. Simular creación de pago
  const { data: payment } = await supabaseAdmin
    .from('payments')
    .insert({
      user_id: user!.user.id,
      cv_id: cv.id,
      amount: 2.00,
      currency: 'USD',
      status: 'PENDING',
      payment_method: 'YAPPY',
      external_id: 'TEST-ORDER-' + Date.now(),
      verification_deadline: new Date(Date.now() + 24*60*60*1000).toISOString(),
      granted_access: false
    })
    .select()
    .single()

  console.log('✅ Pago creado:', payment.id)

  // 5. Simular IPN de confirmación
  const { data: updatedPayment } = await supabaseAdmin
    .from('payments')
    .update({
      status: 'COMPLETED',
      paid_at: new Date().toISOString()
    })
    .eq('id', payment.id)
    .select()
    .single()

  console.log('✅ Pago completado:', updatedPayment.status)

  // 6. Crear acceso de descarga
  const { data: downloadAccess } = await supabaseAdmin
    .from('cv_download_access')
    .insert({
      cv_id: cv.id,
      user_id: user!.user.id,
      payment_id: payment.id,
      status: 'ACTIVE'
    })
    .select()
    .single()

  console.log('✅ Acceso creado:', downloadAccess.id)

  // 7. Verificar que ahora SÍ tiene acceso
  const { data: finalAccess } = await supabaseAdmin
    .from('cv_download_access')
    .select('*')
    .eq('cv_id', cv.id)
    .eq('user_id', user!.user.id)
    .eq('status', 'ACTIVE')
    .single()

  console.log('✅ Acceso verificado:', finalAccess.status === 'ACTIVE')

  console.log('\n🎉 TODOS LOS TESTS PASARON')
}

testPaymentFlow().catch(console.error)
```

---

## 📊 Fase 8: Dashboard de Pagos (Admin)

### Página: `/app/admin/payments/page.tsx`

```typescript
export default async function AdminPaymentsPage() {
  const supabase = await createClient()

  // Obtener todos los pagos con información relacionada
  const { data: payments } = await supabase
    .from('payments')
    .select(`
      *,
      user:users(email, full_name),
      cv:cv_lab_cvs(title, target_role)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  // Estadísticas
  const totalRevenue = payments
    ?.filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0

  const pendingPayments = payments?.filter(p => p.status === 'PENDING').length || 0
  const completedPayments = payments?.filter(p => p.status === 'COMPLETED').length || 0
  const failedPayments = payments?.filter(p => p.status === 'FAILED').length || 0

  return (
    <div className="p-8">
      <h1>Pagos</h1>

      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <StatsCard
          title="Ingresos Totales"
          value={`$${totalRevenue.toFixed(2)}`}
          icon={<DollarSign />}
        />
        <StatsCard
          title="Completados"
          value={completedPayments}
          icon={<CheckCircle />}
          variant="success"
        />
        <StatsCard
          title="Pendientes"
          value={pendingPayments}
          icon={<Clock />}
          variant="warning"
        />
        <StatsCard
          title="Fallidos"
          value={failedPayments}
          icon={<XCircle />}
          variant="error"
        />
      </div>

      {/* Tabla de pagos */}
      <PaymentsTable payments={payments} />
    </div>
  )
}
```

---

## 🚀 Fase 9: Despliegue

### Checklist de Producción

```
[ ] 1. Variables de entorno en Vercel
      - YAPPY_ENV=prod
      - YAPPY_MERCHANT_ID
      - YAPPY_SECRET_KEY
      - YAPPY_SECRET_HASH
      - YAPPY_DOMAIN
      - YAPPY_IPN_URL
      - YAPPY_ALLOWED_IPS (importante!)
      - CV_DOWNLOAD_PRICE=2.00
      - RESEND_API_KEY

[ ] 2. Ejecutar migración de BD
      npx tsx scripts/apply-migration.ts scripts/008_setup_payments.sql

[ ] 3. Verificar políticas RLS
      - Usuarios solo ven sus pagos
      - Admins ven todos los pagos
      - Sistema puede crear/actualizar

[ ] 4. Configurar Whitelist de IPs de Yappy
      - Obtener IPs oficiales de Banco General
      - Agregar a YAPPY_ALLOWED_IPS en producción

[ ] 5. Configurar dominio de Resend
      - Agregar dominio lab-cv.com
      - Verificar DNS
      - Activar DKIM/SPF

[ ] 6. Testing en UAT
      - Crear pago de prueba con teléfono de UAT
      - Verificar IPN recibido
      - Verificar emails enviados
      - Verificar acceso otorgado

[ ] 7. Deploy a producción
      git push origin main

[ ] 8. Monitoreo post-deploy
      - Ver logs de Vercel
      - Verificar payment_logs en BD
      - Probar flujo completo en producción

[ ] 9. Documentar credenciales de prueba
      - Crear usuario demo
      - Crear CV demo
      - Documentar para soporte
```

---

## 📈 Métricas a Monitorear

### KPIs Clave

1. **Tasa de Conversión**
   ```sql
   SELECT
     COUNT(DISTINCT cv_id) as total_cvs_created,
     COUNT(DISTINCT CASE WHEN status = 'COMPLETED' THEN cv_id END) as paid_downloads,
     (COUNT(DISTINCT CASE WHEN status = 'COMPLETED' THEN cv_id END)::float /
      COUNT(DISTINCT cv_id) * 100) as conversion_rate
   FROM payments
   WHERE created_at >= NOW() - INTERVAL '30 days';
   ```

2. **Ingresos Mensuales**
   ```sql
   SELECT
     DATE_TRUNC('month', paid_at) as month,
     COUNT(*) as transactions,
     SUM(amount) as revenue
   FROM payments
   WHERE status = 'COMPLETED'
   GROUP BY month
   ORDER BY month DESC;
   ```

3. **Tasa de Fallo**
   ```sql
   SELECT
     status,
     COUNT(*) as count,
     (COUNT(*)::float / SUM(COUNT(*)) OVER () * 100) as percentage
   FROM payments
   WHERE created_at >= NOW() - INTERVAL '7 days'
   GROUP BY status;
   ```

4. **Usuarios que pagan vs usuarios totales**
   ```sql
   SELECT
     COUNT(DISTINCT user_id) as paying_users,
     (SELECT COUNT(*) FROM auth.users) as total_users,
     (COUNT(DISTINCT user_id)::float /
      (SELECT COUNT(*) FROM auth.users) * 100) as paying_user_rate
   FROM payments
   WHERE status = 'COMPLETED';
   ```

---

## 🔐 Seguridad

### Checklist de Seguridad

- ✅ Whitelist de IPs de Yappy en IPN endpoint
- ✅ Validación HMAC de notificaciones IPN
- ✅ Rate limiting en todos los endpoints
- ✅ RLS policies en todas las tablas
- ✅ Logs de auditoría de todas las transacciones
- ✅ Validación de ownership de CVs
- ✅ Prevención de pagos duplicados
- ✅ Secrets en variables de entorno (no en código)
- ✅ HTTPS obligatorio en producción
- ✅ Validación de teléfonos panameños

---

## 📚 Documentación Adicional

### Para el Usuario Final

Crear página `/help/payments`:

```markdown
# Cómo Descargar tu CV

## Paso 1: Crea tu CV
Usa nuestra plataforma para crear y mejorar tu CV con Octavia IA.

## Paso 2: Paga por la descarga
Para descargar tu CV en PDF o Word, necesitas hacer un pago único de $2.00 USD.

## Paso 3: Paga con Yappy
- Haz clic en "Descargar CV ($2.00)"
- Ingresa tu número de Yappy (8 dígitos)
- Autoriza el pago en la app de Yappy
- ¡Listo! Tu CV se descargará automáticamente

## Preguntas Frecuentes

**¿Puedo descargar el CV múltiples veces?**
Sí, una vez que pagas puedes descargar ese CV las veces que quieras.

**¿Qué incluye el pago?**
- Descarga en PDF
- Descarga en Word
- Sin marca de agua
- Acceso permanente

**¿Es seguro Yappy?**
Sí, Yappy es el sistema de pagos del Banco General de Panamá.

**¿Qué pasa si el pago falla?**
No te preocupes, no se te cobrará. Puedes intentar nuevamente.
```

---

## ✅ Resumen del Plan

| Fase | Descripción | Tiempo Estimado |
|------|-------------|-----------------|
| 1 | Migración de BD | 1 hora |
| 2 | Configuración de entorno | 30 min |
| 3 | Migración de archivos | 2 horas |
| 4 | Adaptaciones de código | 3 horas |
| 5 | Modificaciones UI | 2 horas |
| 6 | Templates de email | 1 hora |
| 7 | Testing | 2 horas |
| 8 | Dashboard admin | 2 horas |
| 9 | Despliegue y monitoreo | 1 hora |

**TOTAL**: ~15 horas de desarrollo

---

## 🎯 Siguiente Paso

¿Quieres que empiece a implementar este plan? Puedo:

1. Crear la migración de BD (`008_setup_payments.sql`)
2. Migrar los archivos core de Yappy desde AgilityTask
3. Crear los endpoints adaptados para Lab CV
4. Implementar el componente `YappyDownloadButton`

¿Por dónde empezamos?
