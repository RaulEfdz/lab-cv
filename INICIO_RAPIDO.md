# 🚀 Inicio Rápido - Testing Multi-Usuario

## ⚡ Opción 1: Script Automático (RECOMENDADO)

```bash
./scripts/setup-and-test.sh
```

El script te guiará paso a paso:
1. ✅ Verifica variables de entorno
2. ✅ Instala dependencias necesarias
3. ✅ Te recuerda ejecutar el script SQL
4. ✅ Ejecuta todos los tests automáticamente
5. ✅ Muestra resumen de resultados

---

## 📋 Opción 2: Manual (Paso a Paso)

### Paso 1: Ejecutar Script SQL

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Abre: `scripts/restrict-admin-access.sql`
3. Copia TODO el contenido
4. Pega en SQL Editor
5. Click en **"Run"**

### Paso 2: Ejecutar Tests

```bash
npx tsx scripts/test-multi-user.ts
```

### Resultado Esperado

```
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

## 🧪 Usuarios de Prueba Creados

El script automáticamente crea:

| Email | Password | Rol |
|-------|----------|-----|
| `usuario1@test.com` | `TestPassword123!` | user |
| `usuario2@test.com` | `TestPassword123!` | user |
| `usuario3@test.com` | `TestPassword123!` | user |

Cada usuario tendrá 1 CV de prueba.

---

## ✅ Verificación Manual

### Como Usuario Regular:

```
URL: http://localhost:3000/login
Email: usuario1@test.com
Password: TestPassword123!
```

**Debe:**
- ✅ Ver solo SU CV en `/dashboard`
- ❌ NO ver CVs de otros usuarios
- ❌ NO poder acceder a `/admin/*`

### Como Admin:

```
URL: http://localhost:3000/admin/login
Email: raulefdz@gmail.com
Password: [tu contraseña real]
```

**Debe:**
- ✅ Ver TODOS los CVs en `/admin/cv-lab`
- ✅ Acceder a todas las secciones de admin
- ✅ Ver badge "Administrador" en perfil

---

## ⚠️ Si Algo Falla

### Error: "Variables de entorno no configuradas"

Crea `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SECRET_KEY=eyJxxx...
```

### Error: "Cannot find module 'tsx'"

```bash
npm install -D tsx
```

### Tests fallan: "FUGA DE DATOS"

⚠️ **CRÍTICO**
1. Ve a Supabase Dashboard
2. Re-ejecuta `scripts/restrict-admin-access.sql`
3. Verifica que RLS está habilitado
4. Vuelve a ejecutar los tests

---

## 📚 Documentación Completa

Para más detalles, ver:
- `TESTING_MULTI_USER.md` - Guía detallada de testing
- `RESUMEN_IMPLEMENTACION.md` - Resumen completo de cambios
- `SECURITY_FIXES.md` - Lista de correcciones de seguridad

---

## 🎉 ¡Listo!

Si todos los tests pasan, tu sistema está:
- ✅ Seguro
- ✅ Multi-usuario funcional
- ✅ Sin fuga de información
- ✅ Listo para producción

**Siguiente paso:** Deploy a producción (ejecutar mismo proceso en producción)
