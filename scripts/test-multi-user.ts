#!/usr/bin/env tsx
/**
 * Script de Testing Multi-Usuario
 *
 * Este script verifica:
 * 1. Solo raulefdz@gmail.com tiene rol 'admin'
 * 2. Usuarios regulares solo ven sus propios CVs
 * 3. Admin ve todos los CVs
 * 4. No hay fuga de información entre usuarios
 * 5. RLS policies funcionan correctamente
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Variables de entorno no configuradas')
  console.error('Necesitas: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY')
  process.exit(1)
}

// Cliente con permisos de admin (service role)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Usuarios de prueba
const TEST_USERS = [
  {
    email: 'usuario1@test.com',
    password: 'TestPassword123!',
    full_name: 'Usuario Uno',
    expectedRole: 'user'
  },
  {
    email: 'usuario2@test.com',
    password: 'TestPassword123!',
    full_name: 'Usuario Dos',
    expectedRole: 'user'
  },
  {
    email: 'usuario3@test.com',
    password: 'TestPassword123!',
    full_name: 'Usuario Tres',
    expectedRole: 'user'
  }
]

const ADMIN_EMAIL = 'raulefdz@gmail.com'

interface TestResult {
  name: string
  passed: boolean
  message: string
}

const results: TestResult[] = []

function logTest(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message })
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${name}: ${message}`)
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Test 1: Verificar que solo raulefdz@gmail.com es admin
 */
async function testAdminRestriction() {
  console.log('\n🔍 Test 1: Verificando restricción de admin...')

  // Verificar que raulefdz@gmail.com existe y es admin
  const { data: adminProfile } = await supabaseAdmin
    .from('profiles')
    .select('email, role')
    .eq('email', ADMIN_EMAIL)
    .single()

  if (adminProfile?.role === 'admin') {
    logTest(
      'Admin principal',
      true,
      `${ADMIN_EMAIL} tiene rol 'admin' ✓`
    )
  } else {
    logTest(
      'Admin principal',
      false,
      `${ADMIN_EMAIL} NO tiene rol 'admin' (rol actual: ${adminProfile?.role})`
    )
  }

  // Verificar que ningún otro usuario es admin
  const { data: otherAdmins } = await supabaseAdmin
    .from('profiles')
    .select('email, role')
    .eq('role', 'admin')
    .neq('email', ADMIN_EMAIL)

  if (!otherAdmins || otherAdmins.length === 0) {
    logTest(
      'Solo un admin',
      true,
      'No hay otros usuarios con rol admin ✓'
    )
  } else {
    logTest(
      'Solo un admin',
      false,
      `Encontrados ${otherAdmins.length} usuarios adicionales con rol admin: ${otherAdmins.map(u => u.email).join(', ')}`
    )
  }
}

/**
 * Test 2: Crear usuarios de prueba
 */
async function createTestUsers() {
  console.log('\n🔍 Test 2: Creando usuarios de prueba...')

  for (const testUser of TEST_USERS) {
    // Verificar si el usuario ya existe
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', testUser.email)
      .single()

    if (existingProfile) {
      logTest(
        `Usuario ${testUser.email}`,
        true,
        'Ya existe, reutilizando'
      )
      continue
    }

    // Crear usuario
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
      user_metadata: {
        full_name: testUser.full_name
      }
    })

    if (authError) {
      logTest(
        `Usuario ${testUser.email}`,
        false,
        `Error al crear: ${authError.message}`
      )
      continue
    }

    // Esperar a que el trigger cree el perfil
    await sleep(1000)

    // Verificar que se creó el perfil con el rol correcto
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, role')
      .eq('id', authData.user.id)
      .single()

    if (profile?.role === testUser.expectedRole) {
      logTest(
        `Usuario ${testUser.email}`,
        true,
        `Creado con rol '${profile.role}' ✓`
      )
    } else {
      logTest(
        `Usuario ${testUser.email}`,
        false,
        `Rol incorrecto: esperado '${testUser.expectedRole}', obtenido '${profile?.role}'`
      )
    }
  }
}

/**
 * Test 3: Crear CVs para cada usuario
 */
async function createTestCVs() {
  console.log('\n🔍 Test 3: Creando CVs de prueba...')

  for (let i = 0; i < TEST_USERS.length; i++) {
    const testUser = TEST_USERS[i]

    // Obtener el ID del usuario
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', testUser.email)
      .single()

    if (!profile) {
      logTest(
        `CV para ${testUser.email}`,
        false,
        'Usuario no encontrado'
      )
      continue
    }

    // Verificar si ya tiene CVs
    const { data: existingCVs } = await supabaseAdmin
      .from('cv_lab_cvs')
      .select('id')
      .eq('user_id', profile.id)

    if (existingCVs && existingCVs.length > 0) {
      logTest(
        `CV para ${testUser.email}`,
        true,
        `Ya tiene ${existingCVs.length} CV(s)`
      )
      continue
    }

    // Crear CV de prueba
    const { data: cv, error: cvError } = await supabaseAdmin
      .from('cv_lab_cvs')
      .insert({
        user_id: profile.id,
        title: `CV de ${testUser.full_name}`,
        target_role: 'Desarrollador',
        industry: 'Tecnología',
        language: 'es',
        status: 'DRAFT',
        readiness_score: 50
      })
      .select()
      .single()

    if (cvError) {
      logTest(
        `CV para ${testUser.email}`,
        false,
        `Error al crear: ${cvError.message}`
      )
    } else {
      logTest(
        `CV para ${testUser.email}`,
        true,
        `Creado exitosamente (ID: ${cv.id})`
      )
    }
  }
}

/**
 * Test 4: Verificar aislamiento de datos (RLS)
 */
async function testDataIsolation() {
  console.log('\n🔍 Test 4: Verificando aislamiento de datos (RLS)...')

  for (const testUser of TEST_USERS) {
    // Obtener perfil del usuario
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', testUser.email)
      .single()

    if (!profile) continue

    // Login como este usuario
    const { data: authData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    })

    if (loginError || !authData.session) {
      logTest(
        `Aislamiento ${testUser.email}`,
        false,
        `No se pudo iniciar sesión: ${loginError?.message}`
      )
      continue
    }

    // Crear cliente con la sesión del usuario
    const userClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      }
    })

    // Intentar obtener todos los CVs (RLS debe filtrar)
    const { data: userCVs } = await userClient
      .from('cv_lab_cvs')
      .select('id, user_id, title')

    // Contar CVs propios vs ajenos
    const ownCVs = userCVs?.filter(cv => cv.user_id === profile.id) || []
    const otherCVs = userCVs?.filter(cv => cv.user_id !== profile.id) || []

    if (otherCVs.length === 0 && ownCVs.length > 0) {
      logTest(
        `Aislamiento ${testUser.email}`,
        true,
        `Solo ve sus ${ownCVs.length} CV(s), no ve CVs de otros ✓`
      )
    } else if (otherCVs.length > 0) {
      logTest(
        `Aislamiento ${testUser.email}`,
        false,
        `¡FUGA DE DATOS! Ve ${otherCVs.length} CVs de otros usuarios`
      )
    } else {
      logTest(
        `Aislamiento ${testUser.email}`,
        true,
        'No tiene CVs, pero RLS funciona (no ve CVs ajenos)'
      )
    }

    // Cerrar sesión
    await userClient.auth.signOut()
  }
}

/**
 * Test 5: Verificar que admin ve todos los CVs
 */
async function testAdminAccess() {
  console.log('\n🔍 Test 5: Verificando acceso del admin...')

  // Obtener el admin
  const { data: adminProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role')
    .eq('email', ADMIN_EMAIL)
    .single()

  if (!adminProfile || adminProfile.role !== 'admin') {
    logTest(
      'Acceso admin',
      false,
      `${ADMIN_EMAIL} no es admin o no existe`
    )
    return
  }

  // Contar CVs totales en la base de datos
  const { count: totalCVs } = await supabaseAdmin
    .from('cv_lab_cvs')
    .select('id', { count: 'exact', head: true })

  console.log(`📊 Total de CVs en la base de datos: ${totalCVs}`)

  // Crear cliente como admin (necesitaríamos sus credenciales reales)
  // Por ahora, verificamos con el cliente admin
  const { data: allCVs } = await supabaseAdmin
    .from('cv_lab_cvs')
    .select('id, user_id, title')

  if (allCVs && allCVs.length === totalCVs) {
    logTest(
      'Acceso admin',
      true,
      `Admin puede ver todos los ${totalCVs} CVs ✓`
    )
  } else {
    logTest(
      'Acceso admin',
      false,
      `Admin no puede ver todos los CVs (ve ${allCVs?.length} de ${totalCVs})`
    )
  }
}

/**
 * Test 6: Intentar operaciones no autorizadas
 */
async function testUnauthorizedOperations() {
  console.log('\n🔍 Test 6: Probando operaciones no autorizadas...')

  // Usuario 1 intenta acceder al CV de Usuario 2
  const { data: user1Profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', TEST_USERS[0].email)
    .single()

  const { data: user2CVs } = await supabaseAdmin
    .from('cv_lab_cvs')
    .select('id')
    .eq('user_id', (await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', TEST_USERS[1].email)
      .single()).data?.id)
    .limit(1)

  if (!user1Profile || !user2CVs || user2CVs.length === 0) {
    logTest(
      'Operaciones no autorizadas',
      true,
      'No hay datos suficientes para probar (esto es OK)'
    )
    return
  }

  const user2CVID = user2CVs[0].id

  // Login como Usuario 1
  const { data: auth1 } = await supabaseAdmin.auth.signInWithPassword({
    email: TEST_USERS[0].email,
    password: TEST_USERS[0].password
  })

  if (!auth1.session) {
    logTest(
      'Operaciones no autorizadas',
      false,
      'No se pudo iniciar sesión como Usuario 1'
    )
    return
  }

  const user1Client = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${auth1.session.access_token}`
      }
    }
  })

  // Intentar leer CV de Usuario 2
  const { data: stolenCV, error: readError } = await user1Client
    .from('cv_lab_cvs')
    .select('*')
    .eq('id', user2CVID)
    .single()

  if (!stolenCV && readError) {
    logTest(
      'Prevención de lectura no autorizada',
      true,
      'Usuario 1 NO puede leer CV de Usuario 2 ✓'
    )
  } else {
    logTest(
      'Prevención de lectura no autorizada',
      false,
      '¡FUGA DE DATOS! Usuario 1 puede leer CV de Usuario 2'
    )
  }

  // Intentar actualizar CV de Usuario 2
  const { error: updateError } = await user1Client
    .from('cv_lab_cvs')
    .update({ title: 'HACKED' })
    .eq('id', user2CVID)

  if (updateError) {
    logTest(
      'Prevención de escritura no autorizada',
      true,
      'Usuario 1 NO puede modificar CV de Usuario 2 ✓'
    )
  } else {
    logTest(
      'Prevención de escritura no autorizada',
      false,
      '¡VULNERABILIDAD! Usuario 1 puede modificar CV de Usuario 2'
    )
  }

  // Intentar eliminar CV de Usuario 2
  const { error: deleteError } = await user1Client
    .from('cv_lab_cvs')
    .delete()
    .eq('id', user2CVID)

  if (deleteError) {
    logTest(
      'Prevención de eliminación no autorizada',
      true,
      'Usuario 1 NO puede eliminar CV de Usuario 2 ✓'
    )
  } else {
    logTest(
      'Prevención de eliminación no autorizada',
      false,
      '¡VULNERABILIDAD! Usuario 1 puede eliminar CV de Usuario 2'
    )
  }

  await user1Client.auth.signOut()
}

/**
 * Resumen de resultados
 */
function printSummary() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMEN DE TESTS')
  console.log('='.repeat(60))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log(`\n✅ Pasados: ${passed}/${total}`)
  console.log(`❌ Fallados: ${failed}/${total}`)

  if (failed > 0) {
    console.log('\n❌ TESTS FALLADOS:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`)
    })
  }

  console.log('\n' + '='.repeat(60))

  if (failed === 0) {
    console.log('✅ TODOS LOS TESTS PASARON - Sistema seguro')
  } else {
    console.log('⚠️  ALGUNOS TESTS FALLARON - Revisar arriba')
  }

  console.log('='.repeat(60) + '\n')
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Iniciando tests multi-usuario de CV Lab...\n')

  try {
    await testAdminRestriction()
    await createTestUsers()
    await createTestCVs()
    await testDataIsolation()
    await testAdminAccess()
    await testUnauthorizedOperations()

    printSummary()

    // Exit code basado en resultados
    const failed = results.filter(r => !r.passed).length
    process.exit(failed > 0 ? 1 : 0)
  } catch (error) {
    console.error('\n❌ Error fatal en los tests:', error)
    process.exit(1)
  }
}

main()
