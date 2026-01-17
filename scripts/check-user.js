const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

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

async function checkUser() {
  const email = 'raulefbethancourt@gmail.com';

  console.log('Buscando usuario con email:', email);
  console.log('-------------------------------------------');

  // Buscar en profiles
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (profileError) {
    console.log('❌ No se encontró el perfil en la tabla profiles');
    console.log('Error:', profileError.message);
  } else {
    console.log('✅ Perfil encontrado en tabla profiles:');
    console.log('  - ID:', profile.id);
    console.log('  - Email:', profile.email);
    console.log('  - Role:', profile.role);
    console.log('  - Created at:', profile.created_at);
  }

  console.log('-------------------------------------------');

  // Si existe el perfil, buscar en auth.users
  if (profile) {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.id);

    if (authError) {
      console.log('❌ Error al buscar en auth.users:', authError.message);
    } else {
      const user = authData.user;
      console.log('✅ Usuario encontrado en auth.users:');
      console.log('  - ID:', user.id);
      console.log('  - Email:', user.email);
      console.log('  - Email confirmado:', user.email_confirmed_at ? '✅ SÍ' : '❌ NO');
      if (user.email_confirmed_at) {
        console.log('  - Fecha confirmación:', user.email_confirmed_at);
      } else {
        console.log('  - ⚠️  LA CUENTA NO ESTÁ VERIFICADA');
      }
      console.log('  - Creado:', user.created_at);
      console.log('  - Última sesión:', user.last_sign_in_at || 'Nunca');
    }
  }
}

checkUser().catch(console.error);
