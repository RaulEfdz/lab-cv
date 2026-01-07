import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('🔄 Ejecutando migración de pagos...\n')

  const sqlScript = fs.readFileSync(
    path.join(__dirname, '008_setup_payments.sql'),
    'utf-8'
  )

  try {
    // Ejecutar el script SQL completo usando RPC
    const { error } = await supabase.rpc('exec_sql', { sql: sqlScript })

    if (error) {
      console.error('❌ Error ejecutando migración:', error)
      process.exit(1)
    }

    console.log('✅ Migración ejecutada exitosamente!')
    console.log('\nTablas creadas:')
    console.log('  - payments')
    console.log('  - cv_download_access')
    console.log('  - payment_logs')
    console.log('\nEnums creados:')
    console.log('  - payment_status')
    console.log('  - payment_method')
    console.log('  - payment_event')
    console.log('  - log_status')
    console.log('\nPolíticas RLS aplicadas ✓')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

runMigration()
