# 🎯 EMPIEZA AQUÍ - CV Lab Nueva Base de Datos

## ✅ ¿Qué está Listo?

- ✅ Aplicación creada y funcionando
- ✅ Código del CV Lab copiado completamente
- ✅ Dependencias instaladas (206 paquetes)
- ✅ Variables de entorno configuradas para nueva BD
- ✅ Scripts de migración listos
- ✅ Servidor corriendo en http://localhost:3001

## ⚠️ ¿Qué Falta? (5 minutos de trabajo)

Necesitas completar 3 cosas:

### 1️⃣ Obtener 1 Clave de Supabase (1 minuto)

**Abre este link**: https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/settings/api

Verás una página como esta:

```
┌─────────────────────────────────────────┐
│ Project API keys                        │
├─────────────────────────────────────────┤
│ URL                                     │
│ https://ygvzkfotrdqyehiqljle.supabase.co│ ← Ya configurada ✅
│                                         │
│ publishable key                         │
│ sb_publishable_...                      │ ← Ya configurada ✅
│ [Copy]                                  │
│                                         │
│ service_role (Secret)                   │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6...       │ ← COPIAR ESTA (única clave necesaria)
│ [Copy]                                  │
└─────────────────────────────────────────┘
```

**Actualiza el archivo `.env`**:
```bash
# Abre el archivo:
code .env
# o
nano .env

# Busca esta línea y pega la clave:
SUPABASE_SECRET_KEY="sb_secret_..."  # ← Pega la secret key aquí
```

**Nota**: La `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ya está configurada ✅

### 2️⃣ Crear las Tablas (1 minuto)

**Abre este link**: https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/sql/new

```
┌─────────────────────────────────────────┐
│ SQL Editor                              │
├─────────────────────────────────────────┤
│                                         │
│  [Pega aquí el contenido del script]   │ ← Copiar TUTTO el archivo
│                                         │  scripts/001_setup_cv_lab_database.sql
│                                         │
│                                         │
│                         [Run] ▶         │ ← Click aquí
└─────────────────────────────────────────┘
```

**Pasos**:
1. Abre `scripts/001_setup_cv_lab_database.sql` en tu editor
2. Selecciona TODO (Cmd+A en Mac, Ctrl+A en Windows)
3. Copia (Cmd+C / Ctrl+C)
4. Pega en el SQL Editor de Supabase
5. Click en **Run** (botón verde)
6. Espera 5-10 segundos
7. Deberías ver: ✅ Success! (abajo a la derecha)

### 3️⃣ Crear Tu Usuario (2 minutos)

**Parte A: Crear usuario en Auth**

Abre: https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/auth/users

```
┌─────────────────────────────────────────┐
│ Authentication > Users                  │
├─────────────────────────────────────────┤
│                                         │
│ [Add user ▼]                            │ ← Click aquí
│   └─ Create new user                    │ ← Selecciona esto
│                                         │
└─────────────────────────────────────────┘

Se abre un modal:

┌─────────────────────────────────────────┐
│ Create new user                         │
├─────────────────────────────────────────┤
│ Email: [tu-email@ejemplo.com]          │ ← Tu email
│ Password: [••••••••]                    │ ← Tu password
│ Auto Confirm User: ☑                    │ ← IMPORTANTE: Marcar
│                                         │
│                  [Cancel] [Create user] │
└─────────────────────────────────────────┘
```

**IMPORTANTE**: Después de crear, verás el usuario en la lista. **COPIA EL USER ID** (es un UUID largo)

**Parte B: Agregar a tabla admins**

Vuelve al SQL Editor: https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/sql/new

Ejecuta este SQL (reemplaza los valores):

```sql
INSERT INTO public.admins (id, email, full_name)
VALUES (
    'TU-USER-ID-COPIADO-AQUI'::uuid,    -- ← Pega el User ID aquí
    'tu-email@ejemplo.com',              -- ← Tu email (el mismo)
    'Tu Nombre Completo'                 -- ← Tu nombre
);
```

Click **Run**

---

## 🚀 ¡Ahora Prueba la App!

1. **Reinicia el servidor** (si está corriendo):
   ```bash
   # Ctrl+C para detener, luego:
   pnpm dev
   ```

2. **Abre**: http://localhost:3001

3. **Haz login** con el email y password que creaste

4. **Deberías ver**: El dashboard del CV Lab (vacío, sin CVs todavía)

---

## 🔄 Siguiente: Migrar Tus Datos

**⚠️ SOLO después de validar que los pasos anteriores funcionan**

```bash
cd /Users/dev-hyper-rf/Documents/PROYECTOS/RF/lab-cv/scripts
./migrate_cv_data.sh
```

El script:
- Te mostrará cuántos registros hay en la BD antigua
- Te pedirá confirmación antes de continuar
- Exportará e importará todos los datos automáticamente
- Verificará que la migración sea exitosa
- **NO eliminará** los datos de la BD antigua

---

## 🆘 Si Algo No Funciona

### Error: "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"
→ No completaste el Paso 1. Vuelve y copia las claves.

### Error al ejecutar el SQL del Paso 2
→ Verifica que copiaste TODO el archivo (son ~550 líneas)

### No puedo hacer login
→ Asegúrate de:
   1. Haber ejecutado el SQL del Paso 3 Parte B
   2. Usar el email y password exactos
   3. Haber marcado "Auto Confirm User"

### El servidor no inicia
```bash
# Reinstalar dependencias:
pnpm install

# Matar proceso en puerto 3001:
lsof -ti:3001 | xargs kill -9

# Reiniciar:
pnpm dev
```

---

## 📊 Resumen Visual de Tu Progreso

```
┌─────────────────────────────────────────┐
│ ESTADO DE LA MIGRACIÓN                  │
├─────────────────────────────────────────┤
│ ✅ Aplicación creada                    │
│ ✅ Código copiado                       │
│ ✅ Dependencias instaladas              │
│ ✅ .env configurado con nueva BD        │
│ ✅ Scripts listos                       │
│ ⚠️  API Keys pendientes (Paso 1)       │
│ ⚠️  Tablas pendientes (Paso 2)         │
│ ⚠️  Usuario admin pendiente (Paso 3)   │
│ ⚠️  Migración datos pendiente          │
└─────────────────────────────────────────┘
```

---

## 🎯 Archivos de Ayuda

Si necesitas más detalles:

- **QUICKSTART.md** → Guía rápida con más detalles
- **MIGRATION_GUIDE.md** → Guía completa de migración paso a paso
- **README.md** → Documentación completa de la aplicación
- **scripts/migrate_cv_data.sh** → Script de migración automática

---

## ⏱️ Tiempo Total Estimado

- Paso 1: 1 minuto (solo 1 clave)
- Paso 2: 1 minuto
- Paso 3: 2 minutos
- Prueba: 1 minuto
- **Total: ~4 minutos**

(Migración de datos: adicional 5-10 minutos)

---

## 📞 Helper Scripts

Creé un script para ayudarte a obtener las claves:

```bash
./GET_API_KEYS.sh
```

Te abrirá instrucciones detalladas en la terminal.

---

**¡Empieza con el Paso 1!** 🚀

Una vez que termines los 3 pasos, tu aplicación estará funcionando con la nueva base de datos.
