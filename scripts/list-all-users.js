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

async function listAllUsers() {
  console.log('===========================================');
  console.log('LISTADO DE TODOS LOS USUARIOS EN LA BD');
  console.log('===========================================\n');

  try {
    // Obtener todos los perfiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.log('❌ Error al obtener perfiles:', profilesError.message);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  No hay perfiles registrados en la base de datos');
      return;
    }

    console.log(`✅ Se encontraron ${profiles.length} usuario(s):\n`);

    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      console.log(`${i + 1}. ${profile.email}`);
      console.log(`   - ID: ${profile.id}`);
      console.log(`   - Rol: ${profile.role}`);
      console.log(`   - Creado: ${new Date(profile.created_at).toLocaleString('es-ES')}`);

      // Obtener información adicional de auth.users
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.id);

      if (!authError && authData.user) {
        const user = authData.user;
        console.log(`   - Email confirmado: ${user.email_confirmed_at ? '✅ SÍ' : '❌ NO'}`);
        if (user.email_confirmed_at) {
          console.log(`     Fecha: ${new Date(user.email_confirmed_at).toLocaleString('es-ES')}`);
        }
        console.log(`   - Última sesión: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('es-ES') : 'Nunca'}`);
      } else if (authError) {
        console.log(`   - ⚠️  Error al obtener datos de auth: ${authError.message}`);
      }

      console.log('');
    }

    console.log('===========================================');
    console.log(`RESUMEN: ${profiles.length} usuario(s) total`);
    const admins = profiles.filter(p => p.role === 'admin').length;
    const users = profiles.filter(p => p.role === 'user').length;
    console.log(`  - Admins: ${admins}`);
    console.log(`  - Usuarios: ${users}`);
    console.log('===========================================');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listAllUsers();
