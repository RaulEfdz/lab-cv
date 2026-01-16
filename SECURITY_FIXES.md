# Correcciones de Seguridad y Mejoras - Sistema de Autenticación

Fecha: 2026-01-15

## Resumen

Se realizaron 10 correcciones críticas al sistema de login y creación de cuentas para mejorar la seguridad, consistencia y experiencia de usuario.

---

## 1. Email Hardcodeado Eliminado ✅ CRÍTICO

**Problema:** El script de migración contenía un email hardcodeado (`raulefdz@gmail.com`) que automáticamente asignaba rol de admin.

**Archivo:** `scripts/006_setup_multi_tenancy.sql`

**Corrección:**
- Eliminado el email hardcodeado del trigger
- Todos los usuarios nuevos ahora se crean con rol 'user' por defecto
- Se creó script manual `promote-user-to-admin.ts` para promover usuarios de forma segura

**Uso del script:**
```bash
npx tsx scripts/promote-user-to-admin.ts email@ejemplo.com
```

**Impacto:** Alto - Previene escalada de privilegios no autorizada

---

## 2. Validación de Contraseñas Fortalecida ✅ CRÍTICO

**Problema:** Solo se requerían 6 caracteres mínimos sin requisitos de complejidad.

**Archivo nuevo:** `lib/utils/auth-validation.ts`

**Corrección:**
- Mínimo 8 caracteres (antes: 6)
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número
- Bloqueo de contraseñas comunes (password, Password1, etc.)

**Archivos actualizados:**
- `app/(auth)/signup/page.tsx`
- `app/admin/register/page.tsx`

**Impacto:** Alto - Reduce ataques de fuerza bruta

---

## 3. Verificación de Admin Unificada ✅ CRÍTICO

**Problema:** El login de admin verificaba la tabla `admins` mientras el sistema nuevo usa `profiles.role`.

**Archivo:** `app/admin/login/page.tsx`

**Corrección:**
```typescript
// ANTES: Verificaba tabla admins
const { data: adminData } = await supabase
  .from("admins")
  .select("*")
  .eq("email", trimmedEmail)

// AHORA: Verifica rol en profiles
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", data.user.id)

if (profile.role !== 'admin') {
  throw new Error("No tienes permisos de administrador")
}
```

**Impacto:** Alto - Elimina inconsistencia de datos

---

## 4. Validación de Email en Signup ✅ MEDIO

**Problema:** No había validación de formato de email antes de enviar a Supabase.

**Archivos:**
- `app/(auth)/signup/page.tsx`
- `app/admin/register/page.tsx`

**Corrección:**
- Validación con regex antes de signup
- Trim de espacios en blanco
- Mensajes de error claros

**Impacto:** Medio - Mejora UX y previene errores

---

## 5. Reenvío de Email Unificado ✅ MEDIO

**Problema:** Admin login usaba `supabase.auth.resend()` mientras usuarios usaban API endpoint personalizado.

**Archivo:** `app/admin/login/page.tsx`

**Corrección:**
```typescript
// ANTES: Método inconsistente
await supabase.auth.resend({ type: 'signup', email })

// AHORA: Mismo endpoint para todos
await fetch('/api/auth/resend-verification', {
  method: 'POST',
  body: JSON.stringify({ email })
})
```

**Impacto:** Medio - Consistencia en el código

---

## 6. Búsqueda Optimizada de Usuarios ✅ ALTO

**Problema:** `listUsers()` cargaba TODOS los usuarios de la base de datos.

**Archivo:** `app/api/auth/resend-verification/route.ts`

**Corrección:**
```typescript
// ANTES: Ineficiente - lista todos los usuarios
const { data: userData } = await supabaseAdmin.auth.admin.listUsers()
const user = userData.users.find(u => u.email === email)

// AHORA: Busca por índice en profiles
const { data: profile } = await supabaseAdmin
  .from('profiles')
  .select('id')
  .eq('email', email)
  .single()

const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(profile.id)
```

**Impacto:** Alto - Mejora performance significativamente

---

## 7. Validación de Nombre Completo ✅ MEDIO

**Problema:** No había validación de caracteres especiales o longitud.

**Archivo:** `lib/utils/auth-validation.ts`

**Corrección:**
- Entre 2 y 100 caracteres
- Solo letras, espacios, guiones y apóstrofes
- Soporte para acentos y ñ

**Impacto:** Medio - Previene datos corruptos

---

## 8. Eliminación de alert() ✅ BAJO

**Problema:** Uso de `alert()` en lugar de manejo de estado consistente.

**Archivo:** `app/(auth)/login/page.tsx`

**Corrección:**
```typescript
// ANTES
alert("Email de recuperación enviado")

// AHORA
setSuccess("Email de recuperación enviado. Revisa tu bandeja de entrada.")
```

**Impacto:** Bajo - Mejora UX

---

## 9. Flujo de Admin Register Mejorado ✅ MEDIO

**Problema:** Login automático sin verificar email, confusión sobre rol asignado.

**Archivo:** `app/admin/register/page.tsx`

**Corrección:**
- Eliminado login automático
- Redirige a login con mensaje de confirmación
- Comentarios claros sobre promoción manual a admin
- Requiere verificación de email antes de login

**Impacto:** Medio - Mejora seguridad y claridad

---

## 10. Confirmación de Contraseña Agregada ✅ MEDIO

**Problema:** Signup de usuarios no tenía campo de confirmación de contraseña.

**Archivo:** `app/(auth)/signup/page.tsx`

**Corrección:**
- Campo "Confirmar Contraseña" agregado
- Validación de coincidencia antes de enviar
- Mensajes de error claros

**Impacto:** Medio - Previene errores de tipeo

---

## Archivos Creados

1. **`lib/utils/auth-validation.ts`**
   - Utilidades de validación reutilizables
   - Funciones: `validateEmail`, `validatePassword`, `validatePasswordMatch`, `validateFullName`, `validateSignupForm`

2. **`scripts/promote-user-to-admin.ts`**
   - Script CLI para promover usuarios a admin de forma segura
   - Reemplaza el email hardcodeado anterior

3. **`SECURITY_FIXES.md`** (este archivo)
   - Documentación completa de todas las correcciones

---

## Archivos Modificados

1. `scripts/006_setup_multi_tenancy.sql` - Eliminado email hardcodeado
2. `app/(auth)/login/page.tsx` - Eliminado alert(), mejorado manejo de estado
3. `app/(auth)/signup/page.tsx` - Validaciones completas, confirmación de password
4. `app/admin/login/page.tsx` - Verificación unificada, reenvío consistente
5. `app/admin/register/page.tsx` - Validaciones, flujo mejorado
6. `app/api/auth/resend-verification/route.ts` - Búsqueda optimizada

---

## Migraciones Pendientes

### Para aplicar la corrección del trigger en base de datos:

```sql
-- Ejecutar en Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT := 'user';
BEGIN
  -- Por defecto, todos los usuarios nuevos tienen rol 'user'
  -- Los admins deben ser promovidos manualmente por otro admin
  -- o asignados usando el script promote-user-to-admin.ts

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Testing Recomendado

### 1. Test de Registro
- [ ] Intentar registrarse con contraseña débil (debe fallar)
- [ ] Intentar registrarse con email inválido (debe fallar)
- [ ] Registrarse con datos válidos (debe exitoso)
- [ ] Confirmar email de verificación

### 2. Test de Login
- [ ] Login con email no verificado (debe mostrar botón de reenvío)
- [ ] Login con credenciales incorrectas
- [ ] Login exitoso como usuario regular → dashboard de usuario
- [ ] Login exitoso como admin → dashboard de admin

### 3. Test de Admin
- [ ] Intentar acceder a /admin/dashboard como usuario regular (debe fallar)
- [ ] Promover usuario con script: `npx tsx scripts/promote-user-to-admin.ts`
- [ ] Login como admin promovido (debe exitoso)

### 4. Test de Reenvío de Email
- [ ] Reenviar email con cuenta no existente (debe fallar)
- [ ] Reenviar email con cuenta ya verificada (debe fallar)
- [ ] Reenviar email con cuenta no verificada (debe exitoso)

### 5. Test de Recuperación de Contraseña
- [ ] Solicitar reset con email válido
- [ ] Click en link del email
- [ ] Establecer nueva contraseña (debe cumplir requisitos)
- [ ] Login con nueva contraseña

---

## Notas de Seguridad Adicionales

### Implementaciones Futuras Recomendadas:

1. **Rate Limiting** 🔴 ALTA PRIORIDAD
   - Limitar intentos de login (5 intentos / 15 minutos)
   - Limitar reenvío de emails (3 intentos / hora)
   - Usar middleware o Vercel Edge Config

2. **2FA (Two-Factor Authentication)** 🟡 MEDIA PRIORIDAD
   - Implementar para cuentas de admin
   - Usar TOTP (Google Authenticator, Authy)

3. **Logs de Auditoría** 🟡 MEDIA PRIORIDAD
   - Registrar intentos de login fallidos
   - Registrar cambios de rol
   - Registrar acciones sensibles de admin

4. **Session Management** 🟢 BAJA PRIORIDAD
   - Timeout de sesión configurable
   - Refresh token rotation
   - Revocación de sesiones

5. **Password Policies** 🟢 BAJA PRIORIDAD
   - Expiración de contraseñas (90 días)
   - No permitir reutilizar últimas 5 contraseñas
   - Forzar cambio de contraseña en primer login

---

## Comandos Útiles

```bash
# Promover usuario a admin
npx tsx scripts/promote-user-to-admin.ts usuario@ejemplo.com

# Aplicar migraciones (si es necesario)
npx tsx scripts/apply-migration.ts

# Ver usuarios en la base de datos (Supabase Dashboard)
# SQL Editor: SELECT * FROM profiles;
```

---

## Contacto

Si encuentras algún problema de seguridad, repórtalo de inmediato al equipo de desarrollo.

**NO** publiques vulnerabilidades de seguridad en issues públicos.
