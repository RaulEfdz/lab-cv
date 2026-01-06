# Desplegar Lab CV en Vercel

## 📋 Pre-requisitos

- Cuenta de Vercel
- Repositorio GitHub: https://github.com/RaulEfdz/lab-cv
- Variables de entorno configuradas

## 🚀 Pasos para Desplegar

### 1. Importar Proyecto en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en **"Add New..."** → **"Project"**
3. Importa desde GitHub: `RaulEfdz/lab-cv`
4. Configura el proyecto:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`

### 2. Configurar Variables de Entorno

En **Settings** → **Environment Variables**, agrega las siguientes variables:

#### 🔐 Supabase (Obligatorias)
```
NEXT_PUBLIC_SUPABASE_URL=<tu-supabase-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<tu-supabase-publishable-key>
SUPABASE_SECRET_KEY=<tu-supabase-secret-key>
```

#### 🗄️ Database (Obligatorias)
```
DATABASE_URL=<tu-database-url-con-pooler>
DIRECT_URL=<tu-database-direct-url>
```

#### 🤖 OpenAI (Obligatoria)
```
OPENAI_API_KEY=<tu-openai-api-key>
OPENAI_MODEL=gpt-5-mini-2025-08-07
```

#### 📤 UploadThing (Obligatoria)
```
UPLOADTHING_TOKEN=<tu-uploadthing-token>
```

#### 🔗 LinkedIn (Opcional)
```
LINKEDIN_CLIENT_ID=<tu-linkedin-client-id>
LINKEDIN_CLIENT_SECRET=<tu-linkedin-client-secret>
NEXT_PUBLIC_LINKEDIN_REDIRECT_URI=https://tu-dominio.vercel.app/api/auth/callback/linkedin
```

**Nota**: Copia los valores desde tu archivo `.env` local o desde los dashboards respectivos.

**⚠️ IMPORTANTE**: Actualiza `NEXT_PUBLIC_LINKEDIN_REDIRECT_URI` con tu dominio de Vercel.

### 3. Configurar Dominio (Opcional)

En **Settings** → **Domains**, puedes agregar un dominio personalizado:
- Dominio Vercel: `lab-cv-raulefdz.vercel.app`
- Dominio Custom: `tu-dominio.com`

### 4. Desplegar

1. Click en **Deploy**
2. Espera a que termine el build (2-3 minutos)
3. Visita tu URL: `https://lab-cv.vercel.app`

## 🔧 Configuración Post-Despliegue

### Actualizar LinkedIn Redirect URI

1. Ve a [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Selecciona tu app
3. En **Auth** → **Redirect URLs**, agrega:
   ```
   https://tu-dominio.vercel.app/api/auth/callback/linkedin
   ```

### Verificar Base de Datos

1. Asegúrate de que las tablas estén creadas en Supabase
2. Verifica que el prompt v4.3 esté activo:
   ```sql
   SELECT version, is_active FROM cv_lab_prompt_versions;
   ```

### Crear Usuario Admin

Si no tienes un usuario admin, créalo en Supabase:
```sql
-- Ver scripts/002_create_admin_user.sql
```

## 📊 Monitoreo

- **Analytics**: Vercel Analytics está habilitado automáticamente
- **Logs**: Vercel Dashboard → Tu Proyecto → Deployments → Logs
- **Speed Insights**: Settings → Speed Insights → Enable

## 🐛 Troubleshooting

### Error: "Missing environment variables"
- Verifica que todas las variables estén configuradas en Vercel
- Haz un **Redeploy** después de agregar variables

### Error: "Database connection failed"
- Verifica que `DATABASE_URL` y `DIRECT_URL` sean correctos
- Asegúrate de que Supabase permita conexiones desde Vercel

### Error: "OpenAI API key invalid"
- Verifica que la API key sea válida
- Asegúrate de tener créditos en OpenAI

### Build fallido
- Revisa los logs de build en Vercel
- Verifica que `pnpm-lock.yaml` esté commiteado

## 🔄 Actualizar Despliegue

Cada push a `main` desplegará automáticamente:
```bash
git add .
git commit -m "Update features"
git push origin main
```

## 📱 URLs del Proyecto

- **Producción**: https://lab-cv.vercel.app (por configurar)
- **GitHub**: https://github.com/RaulEfdz/lab-cv
- **Supabase**: https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle

---

**Última actualización**: 2026-01-06
**Versión de Octavia**: v4.3-edit-support
