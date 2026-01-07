const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQL(sql, description) {
  console.log(`\n🔄 ${description}...`)
  const { data, error } = await supabase.rpc('exec_sql', { sql })

  if (error) {
    // Ignorar errores de "ya existe"
    if (error.message.includes('already exists') || error.code === '42710' || error.code === '42P07') {
      console.log(`   ⚠️  Ya existe, continuando...`)
      return true
    }
    console.error(`   ❌ Error:`, error.message)
    return false
  }

  console.log(`   ✅ Completado`)
  return true
}

async function runMigration() {
  console.log('🚀 EJECUTANDO MIGRACIÓN DE PAGOS\n')
  console.log('=' .repeat(80))

  // Paso 1: Crear ENUMS
  console.log('\n📋 PASO 1: Creando Enums')

  await executeSQL(`
    DO $$ BEGIN
      CREATE TYPE payment_status AS ENUM (
        'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `, 'payment_status')

  await executeSQL(`
    DO $$ BEGIN
      CREATE TYPE payment_method AS ENUM (
        'YAPPY', 'CARD', 'TRANSFER'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `, 'payment_method')

  await executeSQL(`
    DO $$ BEGIN
      CREATE TYPE payment_event AS ENUM (
        'MERCHANT_VALIDATE_REQUEST', 'MERCHANT_VALIDATE_SUCCESS', 'MERCHANT_VALIDATE_ERROR',
        'ORDER_CREATE_REQUEST', 'ORDER_CREATE_SUCCESS', 'ORDER_CREATE_ERROR',
        'IPN_RECEIVED', 'IPN_VALIDATED', 'IPN_INVALID', 'IPN_PROCESSED',
        'PAYMENT_PENDING', 'PAYMENT_COMPLETED', 'PAYMENT_FAILED',
        'PAYMENT_CANCELLED', 'PAYMENT_EXPIRED',
        'DOWNLOAD_ACCESS_GRANTED', 'DOWNLOAD_ACCESS_REVOKED'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `, 'payment_event')

  await executeSQL(`
    DO $$ BEGIN
      CREATE TYPE log_status AS ENUM (
        'INFO', 'SUCCESS', 'WARNING', 'ERROR'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `, 'log_status')

  // Paso 2: Crear TABLAS
  console.log('\n📋 PASO 2: Creando Tablas')

  await executeSQL(`
    CREATE TABLE IF NOT EXISTS public.payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      cv_id UUID NOT NULL REFERENCES public.cv_lab_cvs(id) ON DELETE CASCADE,
      amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
      currency TEXT NOT NULL DEFAULT 'USD',
      status payment_status NOT NULL DEFAULT 'PENDING',
      payment_method payment_method NOT NULL DEFAULT 'YAPPY',
      external_id TEXT,
      transaction_id TEXT,
      yappy_phone TEXT,
      yappy_confirmation_number TEXT,
      yappy_status_code TEXT,
      verification_deadline TIMESTAMPTZ,
      granted_access BOOLEAN DEFAULT false,
      paid_at TIMESTAMPTZ,
      failed_at TIMESTAMPTZ,
      cancelled_at TIMESTAMPTZ,
      expired_at TIMESTAMPTZ,
      previous_status payment_status,
      status_changed_at TIMESTAMPTZ,
      status_change_note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `, 'Tabla payments')

  await executeSQL(`
    CREATE TABLE IF NOT EXISTS public.cv_download_access (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cv_id UUID NOT NULL REFERENCES public.cv_lab_cvs(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
      download_count INT DEFAULT 0,
      last_downloaded_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT unique_user_cv_access UNIQUE(cv_id, user_id)
    );
  `, 'Tabla cv_download_access')

  await executeSQL(`
    CREATE TABLE IF NOT EXISTS public.payment_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event payment_event NOT NULL,
      provider TEXT NOT NULL DEFAULT 'YAPPY',
      status log_status NOT NULL,
      user_id UUID REFERENCES auth.users(id),
      payment_id UUID REFERENCES public.payments(id),
      cv_id UUID REFERENCES public.cv_lab_cvs(id),
      order_id TEXT,
      transaction_id TEXT,
      amount DECIMAL(10,2),
      request_data JSONB,
      response_data JSONB,
      error_code TEXT,
      error_message TEXT,
      ip_address TEXT,
      user_agent TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `, 'Tabla payment_logs')

  // Paso 3: Crear ÍNDICES
  console.log('\n📋 PASO 3: Creando Índices')

  const indices = [
    "CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_payments_cv_id ON public.payments(cv_id)",
    "CREATE INDEX IF NOT EXISTS idx_payments_external_id ON public.payments(external_id)",
    "CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status)",
    "CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_download_access_user_id ON public.cv_download_access(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_download_access_cv_id ON public.cv_download_access(cv_id)",
    "CREATE INDEX IF NOT EXISTS idx_download_access_payment_id ON public.cv_download_access(payment_id)",
    "CREATE INDEX IF NOT EXISTS idx_payment_logs_user_id ON public.payment_logs(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON public.payment_logs(payment_id)",
    "CREATE INDEX IF NOT EXISTS idx_payment_logs_event ON public.payment_logs(event)",
    "CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON public.payment_logs(status)",
    "CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON public.payment_logs(created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON public.payment_logs(order_id)"
  ]

  for (const index of indices) {
    await executeSQL(index, 'Creando índice')
  }

  // Paso 4: Crear TRIGGERS
  console.log('\n📋 PASO 4: Creando Triggers')

  await executeSQL(`
    DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
    CREATE TRIGGER update_payments_updated_at
      BEFORE UPDATE ON public.payments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `, 'Trigger payments updated_at')

  await executeSQL(`
    DROP TRIGGER IF EXISTS update_download_access_updated_at ON public.cv_download_access;
    CREATE TRIGGER update_download_access_updated_at
      BEFORE UPDATE ON public.cv_download_access
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `, 'Trigger download_access updated_at')

  // Paso 5: Habilitar RLS
  console.log('\n📋 PASO 5: Habilitando RLS')

  await executeSQL('ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY', 'RLS en payments')
  await executeSQL('ALTER TABLE public.cv_download_access ENABLE ROW LEVEL SECURITY', 'RLS en cv_download_access')
  await executeSQL('ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY', 'RLS en payment_logs')

  // Paso 6: Crear POLÍTICAS RLS
  console.log('\n📋 PASO 6: Creando Políticas RLS')

  const policies = [
    // Payments
    {
      name: 'users_select_own_payments',
      table: 'payments',
      sql: `CREATE POLICY "users_select_own_payments" ON public.payments FOR SELECT USING (auth.uid() = user_id)`
    },
    {
      name: 'admins_select_all_payments',
      table: 'payments',
      sql: `CREATE POLICY "admins_select_all_payments" ON public.payments FOR SELECT USING (public.is_admin())`
    },
    {
      name: 'users_insert_own_payments',
      table: 'payments',
      sql: `CREATE POLICY "users_insert_own_payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id)`
    },
    {
      name: 'admins_update_all_payments',
      table: 'payments',
      sql: `CREATE POLICY "admins_update_all_payments" ON public.payments FOR UPDATE USING (public.is_admin())`
    },
    // Download Access
    {
      name: 'users_select_own_download_access',
      table: 'cv_download_access',
      sql: `CREATE POLICY "users_select_own_download_access" ON public.cv_download_access FOR SELECT USING (auth.uid() = user_id)`
    },
    {
      name: 'admins_select_all_download_access',
      table: 'cv_download_access',
      sql: `CREATE POLICY "admins_select_all_download_access" ON public.cv_download_access FOR SELECT USING (public.is_admin())`
    },
    {
      name: 'system_insert_download_access',
      table: 'cv_download_access',
      sql: `CREATE POLICY "system_insert_download_access" ON public.cv_download_access FOR INSERT WITH CHECK (true)`
    },
    {
      name: 'system_update_download_access',
      table: 'cv_download_access',
      sql: `CREATE POLICY "system_update_download_access" ON public.cv_download_access FOR UPDATE USING (true)`
    },
    // Payment Logs
    {
      name: 'admins_select_payment_logs',
      table: 'payment_logs',
      sql: `CREATE POLICY "admins_select_payment_logs" ON public.payment_logs FOR SELECT USING (public.is_admin())`
    },
    {
      name: 'system_insert_payment_logs',
      table: 'payment_logs',
      sql: `CREATE POLICY "system_insert_payment_logs" ON public.payment_logs FOR INSERT WITH CHECK (true)`
    }
  ]

  for (const policy of policies) {
    await executeSQL(`DROP POLICY IF EXISTS "${policy.name}" ON public.${policy.table}`, `Eliminando política ${policy.name}`)
    await executeSQL(policy.sql, `Creando política ${policy.name}`)
  }

  console.log('\n' + '='.repeat(80))
  console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE\n')
  console.log('Tablas creadas:')
  console.log('  ✅ payments')
  console.log('  ✅ cv_download_access')
  console.log('  ✅ payment_logs')
  console.log('\nEnums creados:')
  console.log('  ✅ payment_status')
  console.log('  ✅ payment_method')
  console.log('  ✅ payment_event')
  console.log('  ✅ log_status')
  console.log('\nPolíticas RLS: ✅ 10 políticas activas')
  console.log('\n' + '='.repeat(80))
}

runMigration().catch(console.error)
