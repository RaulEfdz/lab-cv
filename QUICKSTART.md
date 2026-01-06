# 🚀 Guía Rápida de Inicio - CV Lab

## ⚡ Configuración Rápida (5 minutos)

### Paso 1: Obtener Credenciales de Supabase

1. Ve a: https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/settings/api

2. **Copia solo 1 clave**:

   **Secret key** (la que dice "default" en "Secret keys" - ⚠️ mantener secreta)
   ```
   Ejemplo: sb_secret_qEqiz...
   ```

3. **Actualiza el archivo `.env`** en la raíz del proyecto:
   ```bash
   # Busca esta línea y reemplaza:
   SUPABASE_SECRET_KEY="OBTENER_DESDE_DASHBOARD"  # ← Pega la secret key aquí
   ```

**Nota**: Las demás claves (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) ya están configuradas ✅

### Paso 2: Crear Tablas en la Base de Datos

**Opción A: Desde el Dashboard (Más Fácil)**

1. Ve a: https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/sql/new

2. Abre el archivo `scripts/001_setup_cv_lab_database.sql` en tu editor

3. Copia TODO el contenido (Cmd+A, Cmd+C)

4. Pégalo en el SQL Editor de Supabase

5. Click en **Run** (botón verde abajo a la derecha)

6. Espera unos segundos... Deberías ver ✅ Success!

**Opción B: Desde Terminal (Para Expertos)**

```bash
cd /Users/dev-hyper-rf/Documents/PROYECTOS/RF/lab-cv/scripts

psql "postgresql://postgres.ygvzkfotrdqyehiqljle:20fdDdgK8X20R159@db.ygvzkfotrdqyehiqljle.supabase.co:5432/postgres" \
  -f 001_setup_cv_lab_database.sql
```

### Paso 3: Crear Tu Usuario Admin

1. Ve a: https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/auth/users

2. Click en **Add user** → **Create new user**

3. Completa:
   - **Email**: tu-email@ejemplo.com
   - **Password**: tu-password-seguro (guárdalo bien!)
   - **Auto Confirm User**: ✅ Marcar esta casilla

4. Click **Create user**

5. **Copia el User ID** que aparece (es un UUID largo)
   ```
   Ejemplo: 550e8400-e29b-41d4-a716-446655440000
   ```

6. Ve de nuevo al SQL Editor: https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/sql/new

7. Ejecuta este SQL (reemplaza los valores):
   ```sql
   INSERT INTO public.admins (id, email, full_name)
   VALUES (
       'TU-USER-ID-AQUI'::uuid,        -- ← Pega el User ID aquí
       'tu-email@ejemplo.com',          -- ← Tu email
       'Tu Nombre Completo'             -- ← Tu nombre
   );
   ```

8. Click **Run**

### Paso 4: Iniciar la Aplicación

```bash
cd /Users/dev-hyper-rf/Documents/PROYECTOS/RF/lab-cv

# Si el servidor no está corriendo:
pnpm dev
```

Abre tu navegador en: **http://localhost:3001**

### Paso 5: Hacer Login

1. Deberías ver una página de login
2. Ingresa:
   - Email: el que usaste en el Paso 3
   - Password: el que usaste en el Paso 3
3. Click **Iniciar Sesión**

**🎉 ¡Listo!** Deberías ver el dashboard del CV Lab (vacío por ahora)

---

## 🔄 Paso 6: Migrar Datos Existentes (Opcional)

⚠️ **Solo ejecutar DESPUÉS de validar que los pasos 1-5 funcionan correctamente**

### Opción A: Script Automático (Recomendado)

```bash
cd /Users/dev-hyper-rf/Documents/PROYECTOS/RF/lab-cv/scripts
./migrate_cv_data.sh
```

El script te mostrará:
- Cuántos registros hay en la BD antigua
- Te pedirá confirmación
- Exportará e importará automáticamente
- Verificará que todo esté correcto

### Opción B: Manual

Ver el archivo `MIGRATION_GUIDE.md` para instrucciones detalladas.

---

## ✅ Verificación

### Después del Paso 4:
- [ ] El servidor inicia sin errores
- [ ] Puedes abrir http://localhost:3001
- [ ] Ves la página de login

### Después del Paso 5:
- [ ] Puedes hacer login
- [ ] Ves el dashboard (puede estar vacío)
- [ ] No hay errores en la consola

### Después del Paso 6:
- [ ] Tus CVs aparecen en la lista
- [ ] Puedes abrir y editar un CV
- [ ] El chat con IA funciona
- [ ] Puedes crear un nuevo CV

---

## 🆘 Problemas Comunes

### "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"
- **Causa**: No actualizaste el `.env` con las claves
- **Solución**: Vuelve al Paso 1 y copia las claves correctamente

### "Invalid login credentials"
- **Causa**: Email o password incorrectos
- **Solución**: Verifica que el email y password sean exactos

### "User is not an admin"
- **Causa**: No ejecutaste el SQL del Paso 3
- **Solución**: Vuelve al Paso 3, punto 7

### Error al ejecutar SQL
- **Causa**: Las tablas ya existen o hay un error de sintaxis
- **Solución**:
  1. Verifica que copiaste TODO el script
  2. Si ya ejecutaste antes, puedes ignorar errores de "already exists"

### El servidor no inicia
- **Causa**: Puerto 3001 ocupado o dependencias faltantes
- **Solución**:
  ```bash
  # Instalar dependencias
  pnpm install

  # Matar proceso en puerto 3001
  lsof -ti:3001 | xargs kill -9

  # Reiniciar
  pnpm dev
  ```

---

## 📚 Más Información

- **Documentación completa**: Ver `README.md`
- **Guía de migración**: Ver `MIGRATION_GUIDE.md`
- **Resumen de configuración**: Ver `SETUP_SUMMARY.md`

---

## 🎯 Próximos Pasos Después del Inicio

1. **Crear tu primer CV**
2. **Probar el chat con IA (OCTAVIA)**
3. **Exportar a PDF**
4. **Explorar las opciones de training**

---

## ⏱️ Tiempo Estimado

- Paso 1: 1 minuto (solo 1 clave)
- Paso 2: 1 minuto
- Paso 3: 2 minutos
- Paso 4-5: 1 minuto
- Paso 6 (opcional): 5-10 minutos

**Total: ~4-14 minutos** (dependiendo de si migras datos)

---

**¿Listo?** ¡Empieza con el Paso 1! 🚀
