# Guía de Migración - CV Lab a Nueva Base de Datos

## 📋 Resumen

Esta guía te ayudará a migrar tu aplicación CV Lab desde la base de datos compartida con `portfolio-rf` a una base de datos nueva e independiente.

## 🎯 Objetivos

1. ✅ Crear tablas en la nueva base de datos
2. ✅ Configurar credenciales de acceso
3. ✅ Migrar datos existentes
4. ✅ Validar que todo funcione correctamente
5. ✅ Actualizar la aplicación para usar la nueva BD

## 📚 Pre-requisitos

- Acceso al dashboard de Supabase (proyecto: `ygvzkfotrdqyehiqljle`)
- `psql` instalado (para migraciones de datos)
- Acceso a la base de datos antigua (portfolio-rf)

## 🚀 Paso 1: Obtener Credenciales de Supabase

1. Ve a: https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/settings/api

2. Copia las siguientes credenciales:
   - **Project URL**: `https://ygvzkfotrdqyehiqljle.supabase.co`
   - **API Key (anon/public)**: Encontrarás un key que empieza con `eyJhbGc...`
   - **Service Role Key (secret)**: Otro key que también empieza con `eyJhbGc...` pero dice "service_role"

3. Ve a: https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/settings/database

4. Nota las credenciales de PostgreSQL:
   - **Host**: `db.ygvzkfotrdqyehiqljle.supabase.co`
   - **Database**: `postgres`
   - **Port**: `5432` (directo) o `6543` (pooled)
   - **User**: `postgres.ygvzkfotrdqyehiqljle`
   - **Password**: `20fdDdgK8X20R159`

## 🔧 Paso 2: Configurar Variables de Entorno

1. Edita el archivo `.env` en la raíz de `lab-cv/`

2. Reemplaza las secciones de Supabase con:

```bash
# SUPABASE - NUEVA BASE DE DATOS (CV LAB)
NEXT_PUBLIC_SUPABASE_URL="https://ygvzkfotrdqyehiqljle.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="TU_ANON_KEY_AQUI"  # <-- Copiar del dashboard

SUPABASE_URL="https://ygvzkfotrdqyehiqljle.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="TU_SERVICE_ROLE_KEY_AQUI"  # <-- Copiar del dashboard

# PostgreSQL - Nueva BD
POSTGRES_URL="postgresql://postgres.ygvzkfotrdqyehiqljle:20fdDdgK8X20R159@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgresql://postgres.ygvzkfotrdqyehiqljle:20fdDdgK8X20R159@db.ygvzkfotrdqyehiqljle.supabase.co:5432/postgres"
```

3. Guarda el archivo

## 🗄️ Paso 3: Crear Tablas en la Nueva Base de Datos

### Opción A: Desde el Dashboard de Supabase (Recomendado)

1. Ve a: https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/sql/new

2. Abre el archivo `scripts/001_setup_cv_lab_database.sql`

3. Copia todo el contenido y pégalo en el SQL Editor

4. Click en "Run" para ejecutar

5. Verifica que se crearon las tablas:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name LIKE 'cv_lab%'
   ORDER BY table_name;
   ```

   Deberías ver 12 tablas:
   - `cv_lab_cvs`
   - `cv_lab_versions`
   - `cv_lab_messages`
   - `cv_lab_assets`
   - `cv_lab_feedback`
   - `cv_lab_prompt_versions`
   - `cv_lab_learned_patterns`
   - `cv_lab_training_sessions`
   - `cv_lab_training_messages`
   - `cv_lab_training_feedback`
   - `cv_lab_training_progress`
   - `cv_lab_training_tests`

### Opción B: Desde psql (Alternativa)

```bash
cd lab-cv/scripts
psql "postgresql://postgres.ygvzkfotrdqyehiqljle:20fdDdgK8X20R159@db.ygvzkfotrdqyehiqljle.supabase.co:5432/postgres" \
  -f 001_setup_cv_lab_database.sql
```

## 👤 Paso 4: Crear Usuario Admin

### Opción A: Desde Auth UI (Recomendado)

1. Ve a: https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/auth/users

2. Click en "Add user" → "Create new user"

3. Ingresa:
   - **Email**: tu-email@ejemplo.com
   - **Password**: tu-password-seguro
   - **Auto Confirm User**: ✅ Sí

4. Copia el **User ID** (UUID) que se genera

5. Ve al SQL Editor y ejecuta:
   ```sql
   INSERT INTO public.admins (id, email, full_name)
   VALUES (
       'TU-USER-ID-AQUI'::uuid,
       'tu-email@ejemplo.com',
       'Tu Nombre Completo'
   );
   ```

### Opción B: Desde SQL (Alternativa)

Ver el archivo `scripts/002_create_admin_user.sql` para instrucciones detalladas.

## 🚦 Paso 5: Probar Conexión

1. Reinicia el servidor de desarrollo:
   ```bash
   # Detener el servidor actual (Ctrl+C)
   pnpm dev
   ```

2. Abre http://localhost:3001

3. Intenta hacer login con las credenciales que creaste

4. Si todo funciona, deberías ver el dashboard vacío (sin CVs aún)

## 📦 Paso 6: Migrar Datos (Opcional)

**⚠️ IMPORTANTE**: Solo ejecuta este paso cuando hayas validado que la nueva BD funciona correctamente.

### Opción A: Script Automatizado (Recomendado)

```bash
cd lab-cv/scripts
./migrate_cv_data.sh
```

El script:
1. Exporta todos los datos de la BD antigua
2. Los importa a la BD nueva
3. Verifica que la migración sea correcta
4. NO elimina datos de la BD antigua

### Opción B: Manual con psql

Ver `scripts/003_migrate_data_from_old_db.sql` para instrucciones paso a paso.

### Verificación Post-Migración

1. Compara el conteo de registros en ambas BDs:

**BD Antigua**:
```bash
psql "postgresql://postgres.psbcfrlomloecqsyhmed:FS4ozgX4q9QmimEO@aws-1-us-east-1.pooler.supabase.com:5432/postgres" \
  -c "SELECT COUNT(*) FROM cv_lab_cvs;"
```

**BD Nueva**:
```bash
psql "postgresql://postgres.ygvzkfotrdqyehiqljle:20fdDdgK8X20R159@db.ygvzkfotrdqyehiqljle.supabase.co:5432/postgres" \
  -c "SELECT COUNT(*) FROM cv_lab_cvs;"
```

Los números deben coincidir.

2. Verifica que los CVs aparezcan en la aplicación:
   - Ve a http://localhost:3001/admin/cv-lab
   - Deberías ver todos tus CVs anteriores

3. Prueba crear un nuevo CV para verificar que todo funciona

## ✅ Paso 7: Validación Final

### Checklist de Validación

- [ ] El servidor inicia sin errores
- [ ] Puedes hacer login correctamente
- [ ] Los CVs migrados aparecen en la lista
- [ ] Puedes abrir y editar un CV existente
- [ ] El chat con IA funciona
- [ ] Puedes crear un nuevo CV
- [ ] La generación de PDF funciona
- [ ] Las versiones se guardan correctamente

### Si algo falla:

1. **Error de conexión a Supabase**:
   - Verifica que las credenciales en `.env` sean correctas
   - Verifica que el proyecto de Supabase esté activo

2. **Error al crear CV**:
   - Verifica que las tablas se crearon correctamente
   - Verifica las políticas RLS en Supabase

3. **Error de autenticación**:
   - Verifica que tu usuario esté en la tabla `admins`
   - Intenta crear el usuario nuevamente

## 🎉 Paso 8: Finalizar Migración

Una vez que hayas validado que todo funciona:

1. Actualiza el README para reflejar la nueva configuración

2. (Opcional) Comenta o elimina las credenciales de la BD antigua del `.env`

3. (Opcional) Crea un backup de la BD nueva:
   ```bash
   pg_dump "postgresql://postgres.ygvzkfotrdqyehiqljle:20fdDdgK8X20R159@db.ygvzkfotrdqyehiqljle.supabase.co:5432/postgres" \
     > backup_cv_lab_$(date +%Y%m%d).sql
   ```

## 🔄 Rollback (Si algo sale mal)

Si necesitas volver a la BD antigua:

1. Edita `.env` y restaura las credenciales antiguas

2. Reinicia el servidor

3. La aplicación volverá a usar la BD de portfolio-rf

**NOTA**: Los datos en la BD antigua NO se modifican durante la migración, por lo que puedes volver atrás de forma segura.

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs del servidor (`pnpm dev`)
2. Verifica los logs de Supabase en el dashboard
3. Consulta la documentación de Supabase: https://supabase.com/docs

## 🎯 Próximos Pasos

Después de la migración exitosa:

1. Configura backups automáticos en Supabase
2. Considera configurar un entorno de staging
3. Documenta los procedimientos específicos de tu equipo
4. Configura alertas de monitoreo

---

**¡Migración Completada!** 🎊

Ahora tienes CV Lab funcionando con su propia base de datos independiente.
