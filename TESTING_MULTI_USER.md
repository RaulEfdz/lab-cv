# Testing Multi-Usuario y Restricción de Admin

## 🎯 Objetivo

Verificar que:
1. ✅ Solo `raulefdz@gmail.com` tiene rol de administrador
2. ✅ Cada usuario regular solo ve sus propios CVs
3. ✅ No hay fuga de información entre usuarios
4. ✅ Las políticas RLS funcionan correctamente
5. ✅ Admin puede ver todos los CVs

---

## 📋 Pre-requisitos

1. Tener acceso al **Supabase Dashboard**
2. Tener las variables de entorno configuradas:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   SUPABASE_SECRET_KEY=tu_service_role_key
   ```

3. Tener `tsx` instalado:
   ```bash
   npm install -D tsx
   ```

---

## 🔧 Paso 1: Aplicar Restricción de Admin en la Base de Datos

### Opción A: Ejecutar en Supabase Dashboard (RECOMENDADO)

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Abre el archivo `scripts/restrict-admin-access.sql`
3. Copia TODO el contenido
4. Pega en el editor de Supabase
5. Click en **Run**

### Opción B: Verificar manualmente

```sql
-- Ver todos los usuarios y sus roles
SELECT
  email,
  role,
  created_at,
  updated_at
FROM public.profiles
ORDER BY created_at DESC;

-- Debe mostrar:
-- raulefdz@gmail.com | admin | ...
-- otros usuarios      | user  | ...
```

### ⚠️ IMPORTANTE

Después de ejecutar el script SQL:
- ✅ Solo `raulefdz@gmail.com` tendrá rol 'admin'
- ✅ Todos los demás usuarios tendrán rol 'user'
- ✅ No se podrá asignar admin a ningún otro email
- ✅ El trigger de signup asignará admin automáticamente solo a `raulefdz@gmail.com`

---

## 🧪 Paso 2: Ejecutar Tests Automáticos

### 2.1 Ejecutar el script de testing

```bash
npx tsx scripts/test-multi-user.ts
```

### 2.2 Qué hace el script

El script automáticamente:

1. **Verifica restricción de admin:**
   - Confirma que `raulefdz@gmail.com` es admin
   - Confirma que no hay otros admins

2. **Crea 3 usuarios de prueba:**
   - `usuario1@test.com` (rol: user)
   - `usuario2@test.com` (rol: user)
   - `usuario3@test.com` (rol: user)
   - Contraseña para todos: `TestPassword123!`

3. **Crea CVs de prueba:**
   - 1 CV para cada usuario

4. **Verifica aislamiento de datos:**
   - Usuario 1 solo ve su CV
   - Usuario 2 solo ve su CV
   - Usuario 3 solo ve su CV
   - NO hay mezcla de datos

5. **Verifica acceso del admin:**
   - Admin ve TODOS los CVs

6. **Prueba operaciones no autorizadas:**
   - Usuario 1 NO puede leer CV de Usuario 2 ✓
   - Usuario 1 NO puede modificar CV de Usuario 2 ✓
   - Usuario 1 NO puede eliminar CV de Usuario 2 ✓

### 2.3 Resultado esperado

```
🚀 Iniciando tests multi-usuario de CV Lab...

🔍 Test 1: Verificando restricción de admin...
✅ Admin principal: raulefdz@gmail.com tiene rol 'admin' ✓
✅ Solo un admin: No hay otros usuarios con rol admin ✓

🔍 Test 2: Creando usuarios de prueba...
✅ Usuario usuario1@test.com: Creado con rol 'user' ✓
✅ Usuario usuario2@test.com: Creado con rol 'user' ✓
✅ Usuario usuario3@test.com: Creado con rol 'user' ✓

🔍 Test 3: Creando CVs de prueba...
✅ CV para usuario1@test.com: Creado exitosamente (ID: xxx) ✓
✅ CV para usuario2@test.com: Creado exitosamente (ID: xxx) ✓
✅ CV para usuario3@test.com: Creado exitosamente (ID: xxx) ✓

🔍 Test 4: Verificando aislamiento de datos (RLS)...
✅ Aislamiento usuario1@test.com: Solo ve sus 1 CV(s), no ve CVs de otros ✓
✅ Aislamiento usuario2@test.com: Solo ve sus 1 CV(s), no ve CVs de otros ✓
✅ Aislamiento usuario3@test.com: Solo ve sus 1 CV(s), no ve CVs de otros ✓

🔍 Test 5: Verificando acceso del admin...
📊 Total de CVs en la base de datos: 3
✅ Acceso admin: Admin puede ver todos los 3 CVs ✓

🔍 Test 6: Probando operaciones no autorizadas...
✅ Prevención de lectura no autorizada: Usuario 1 NO puede leer CV de Usuario 2 ✓
✅ Prevención de escritura no autorizada: Usuario 1 NO puede modificar CV de Usuario 2 ✓
✅ Prevención de eliminación no autorizada: Usuario 1 NO puede eliminar CV de Usuario 2 ✓

============================================================
📊 RESUMEN DE TESTS
============================================================

✅ Pasados: 15/15
❌ Fallados: 0/15

============================================================
✅ TODOS LOS TESTS PASARON - Sistema seguro
============================================================
```

---

## 🔍 Paso 3: Verificación Manual (Opcional)

### 3.1 Probar en el navegador

1. **Como Usuario Regular:**
   ```
   Email: usuario1@test.com
   Password: TestPassword123!
   ```
   - Login en `/login`
   - Ir a `/dashboard`
   - Deberías ver SOLO tu CV
   - NO deberías ver CVs de otros usuarios

2. **Como Admin:**
   ```
   Email: raulefdz@gmail.com
   Password: [tu contraseña real]
   ```
   - Login en `/admin/login`
   - Ir a `/admin/cv-lab`
   - Deberías ver TODOS los CVs de todos los usuarios

### 3.2 Probar API Routes directamente

```bash
# Como usuario regular - solo ve sus CVs
curl -X GET "http://localhost:3000/api/cv-lab" \
  -H "Authorization: Bearer [token_de_usuario1]"

# Respuesta esperada: solo CVs de usuario1

# Como admin - ve todos los CVs
curl -X GET "http://localhost:3000/api/cv-lab" \
  -H "Authorization: Bearer [token_de_admin]"

# Respuesta esperada: CVs de todos los usuarios
```

---

## ✅ Checklist de Seguridad

Después de ejecutar los tests, verifica:

- [ ] Solo `raulefdz@gmail.com` tiene rol 'admin'
- [ ] Todos los demás usuarios tienen rol 'user'
- [ ] Usuario 1 solo ve sus CVs en `/dashboard`
- [ ] Usuario 2 solo ve sus CVs en `/dashboard`
- [ ] Usuario 3 solo ve sus CVs en `/dashboard`
- [ ] Admin ve todos los CVs en `/admin/cv-lab`
- [ ] Usuario regular NO puede acceder a `/admin/*` (redirige a login)
- [ ] API `/api/cv-lab` retorna solo CVs del usuario autenticado
- [ ] Crear CV con POST `/api/cv-lab` asigna `user_id` correcto automáticamente
- [ ] No se puede modificar `user_id` de un CV existente

---

## 🛡️ Políticas RLS Aplicadas

El sistema usa las siguientes políticas en Supabase:

### `cv_lab_cvs` table:

```sql
-- SELECT: Usuario ve solo sus CVs, Admin ve todos
CREATE POLICY "Users can view own CVs, admins view all"
ON cv_lab_cvs FOR SELECT
USING (
  auth.uid() = user_id
  OR
  is_admin()
);

-- INSERT: Solo puede crear CVs propios
CREATE POLICY "Users can create own CVs"
ON cv_lab_cvs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Solo puede actualizar CVs propios, Admin puede actualizar todos
CREATE POLICY "Users can update own CVs, admins update all"
ON cv_lab_cvs FOR UPDATE
USING (
  auth.uid() = user_id
  OR
  is_admin()
);

-- DELETE: Solo puede eliminar CVs propios, Admin puede eliminar todos
CREATE POLICY "Users can delete own CVs, admins delete all"
ON cv_lab_cvs FOR DELETE
USING (
  auth.uid() = user_id
  OR
  is_admin()
);
```

---

## 🐛 Troubleshooting

### Error: "SUPABASE_SECRET_KEY no configurado"

Solución: Crea un archivo `.env.local` con:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SECRET_KEY=eyJxxx...
```

### Error: "Cannot find module 'tsx'"

Solución:
```bash
npm install -D tsx
```

### Error: "Usuario no encontrado"

Solución: Ejecuta primero el script SQL en Supabase Dashboard.

### Tests fallan: "FUGA DE DATOS"

⚠️ **CRÍTICO**: Si algún test muestra "FUGA DE DATOS", significa que:
- Las políticas RLS no están aplicadas correctamente
- Hay un problema de seguridad

Solución:
1. Ve a Supabase Dashboard → Authentication → Policies
2. Verifica que RLS esté habilitado en `cv_lab_cvs`
3. Re-ejecuta el script SQL `restrict-admin-access.sql`
4. Contacta al equipo de desarrollo si persiste

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs del script
2. Verifica las políticas RLS en Supabase Dashboard
3. Ejecuta el script SQL nuevamente
4. Crea un issue en el repositorio con los logs completos

---

## 🎉 ¡Todo listo!

Si todos los tests pasan, tu sistema está:
- ✅ Seguro
- ✅ Multi-usuario funcional
- ✅ Sin fuga de información
- ✅ Admin restringido solo a raulefdz@gmail.com
