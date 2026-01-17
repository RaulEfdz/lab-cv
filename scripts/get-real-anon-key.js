const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Usar la secret key para obtener información del proyecto
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function getProjectKeys() {
  console.log('===========================================');
  console.log('OBTENIENDO CLAVES DEL PROYECTO');
  console.log('===========================================\n');

  console.log('Proyecto Supabase ID: ygvzkfotrdqyehiqljle');
  console.log('URL: https://ygvzkfotrdqyehiqljle.supabase.co\n');

  console.log('Para obtener la clave ANON correcta, necesitas:');
  console.log('  1. Ir a: https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/settings/api');
  console.log('  2. En la sección "Project API keys"');
  console.log('  3. Copiar la clave "anon" (public)');
  console.log('  4. Es un JWT que empieza con "eyJ..."\n');

  console.log('===========================================');
  console.log('CLAVES ACTUALES EN .env.local');
  console.log('===========================================\n');

  console.log('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (actual):');
  console.log('  ' + process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  console.log('');

  console.log('⚠️  Nota: Esta clave tiene formato "sb_publishable_..." que no es estándar.');
  console.log('    Las claves anon de Supabase son JWT y empiezan con "eyJ..."');
  console.log('');

  console.log('SUPABASE_SECRET_KEY (service_role):');
  console.log('  ' + process.env.SUPABASE_SECRET_KEY);
  console.log('');

  // Intentar hacer una consulta básica para verificar permisos
  console.log('===========================================');
  console.log('VERIFICANDO PERMISOS');
  console.log('===========================================\n');

  const { data, error } = await supabaseAdmin.from('profiles').select('count').limit(1);

  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ La conexión con admin funciona correctamente');
  }
}

getProjectKeys().catch(console.error);
