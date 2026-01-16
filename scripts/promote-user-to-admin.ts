/**
 * Script para promover un usuario regular a administrador
 *
 * Uso:
 *   npx tsx scripts/promote-user-to-admin.ts <email>
 *
 * Ejemplo:
 *   npx tsx scripts/promote-user-to-admin.ts juan@ejemplo.com
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function promoteUserToAdmin(email: string) {
  try {
    console.log(`\n🔍 Buscando usuario: ${email}`)

    // Buscar el usuario en profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (profileError || !profile) {
      console.error(`❌ Error: Usuario con email ${email} no encontrado`)
      console.error('El usuario debe estar registrado primero')
      process.exit(1)
    }

    // Verificar si ya es admin
    if (profile.role === 'admin') {
      console.log(`✅ El usuario ${email} ya es administrador`)
      process.exit(0)
    }

    console.log(`📝 Usuario encontrado:`)
    console.log(`   - ID: ${profile.id}`)
    console.log(`   - Email: ${profile.email}`)
    console.log(`   - Nombre: ${profile.full_name || 'N/A'}`)
    console.log(`   - Rol actual: ${profile.role}`)

    // Actualizar rol a admin
    console.log(`\n⬆️  Promoviendo a administrador...`)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', profile.id)

    if (updateError) {
      console.error('❌ Error al actualizar rol:', updateError.message)
      process.exit(1)
    }

    // Verificar que la actualización fue exitosa
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', profile.id)
      .single()

    if (updatedProfile?.role === 'admin') {
      console.log(`\n✅ ¡Usuario promovido exitosamente!`)
      console.log(`   ${email} ahora es administrador`)
      console.log(`\n💡 El usuario puede iniciar sesión en /admin/login`)
    } else {
      console.error('❌ Error: La actualización no se reflejó correctamente')
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error)
    process.exit(1)
  }
}

// Obtener email de argumentos
const email = process.argv[2]

if (!email) {
  console.error('❌ Error: Debes proporcionar un email')
  console.error('\nUso:')
  console.error('  npx tsx scripts/promote-user-to-admin.ts <email>')
  console.error('\nEjemplo:')
  console.error('  npx tsx scripts/promote-user-to-admin.ts juan@ejemplo.com')
  process.exit(1)
}

// Validar formato de email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  console.error('❌ Error: Formato de email inválido')
  process.exit(1)
}

promoteUserToAdmin(email)
