const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('===========================================');
console.log('CONFIGURACIÓN ACTUAL DE SUPABASE');
console.log('===========================================\n');

console.log('URL de Supabase:');
console.log('  -', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('');

console.log('Claves configuradas:');
console.log('  - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20) + '...');
console.log('  - SUPABASE_SECRET_KEY:', process.env.SUPABASE_SECRET_KEY?.substring(0, 20) + '...');
console.log('');

console.log('===========================================');
console.log('PROBLEMA IDENTIFICADO');
console.log('===========================================\n');

console.log('❌ La clave "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" NO es válida para Supabase');
console.log('❌ Deberías usar "NEXT_PUBLIC_SUPABASE_ANON_KEY" en su lugar');
console.log('');

console.log('Para obtener la clave ANON correcta:');
console.log('  1. Ve a: https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/settings/api');
console.log('  2. Copia la "anon public" key');
console.log('  3. Reemplaza NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY por NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local');
console.log('');

// Intentar conectar con la clave actual para ver si funciona
console.log('===========================================');
console.log('PROBANDO CONEXIÓN CON CLAVE ACTUAL');
console.log('===========================================\n');

try {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  // Intentar una consulta simple
  supabase.from('profiles').select('count').limit(1).then(({ data, error }) => {
    if (error) {
      console.log('❌ Error al conectar con la clave actual:');
      console.log('  -', error.message);
      console.log('');
      console.log('Esto confirma que necesitas usar la clave ANON correcta de Supabase.');
    } else {
      console.log('⚠️  La conexión funciona, pero debes usar el nombre correcto de la variable.');
      console.log('   Cambia PUBLISHABLE_KEY por ANON_KEY para seguir las convenciones de Supabase.');
    }
  });
} catch (error) {
  console.log('❌ Error al crear cliente:', error.message);
}
