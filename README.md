# Lab CV - CV Builder with AI Assistant

Aplicación independiente para crear y optimizar CVs profesionales con asistencia de IA (OCTAVIA).

## 🚀 Características

- **Chat con IA**: Asistente inteligente (OCTAVIA) powered by OpenAI GPT-5
- **Editor de CV**: Edición manual o asistida por IA
- **Parser de LinkedIn**: Importa tu perfil de LinkedIn automáticamente
- **Parser de Documentos**: Sube tu CV en PDF o Word
- **Control de Versiones**: Historial completo de cambios
- **Score de Completitud**: Análisis automático de qué tan completo está tu CV
- **Generador de PDF**: Exporta tu CV optimizado para ATS
- **Múltiples CVs**: Crea diferentes versiones para distintas posiciones

## 📋 Requisitos Previos

- Node.js 18+ o superior
- pnpm (recomendado) o npm
- Cuenta de Supabase (para base de datos)
- API Key de OpenAI (para el motor de IA)
- LinkedIn App (opcional, para OAuth)

## 🔧 Instalación

1. **Clonar o navegar al proyecto**:
```bash
cd lab-cv
```

2. **Instalar dependencias**:
```bash
pnpm install
```

3. **Configurar variables de entorno**:

Edita el archivo `.env` y completa las credenciales faltantes desde tu panel de Supabase:

```bash
# Obtener desde: https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/settings/api

NEXT_PUBLIC_SUPABASE_ANON_KEY="tu_anon_key"
SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key"
SUPABASE_JWT_SECRET="tu_jwt_secret"
SUPABASE_SECRET_KEY="tu_secret_key"
```

4. **Ejecutar migraciones de base de datos**:

**IMPORTANTE**: Esta aplicación comparte la misma base de datos con `portfolio-rf` por ahora. Las tablas necesarias ya deberían existir:

- `cv_lab_cvs`
- `cv_lab_versions`
- `cv_lab_messages`
- `cv_lab_assets`
- `cv_lab_feedback`
- `cv_lab_prompts`
- `cv_lab_learned_patterns`
- `admins` (para autenticación)

Si necesitas crear las tablas, ejecuta los scripts SQL desde el proyecto `portfolio-rf/scripts/`.

5. **Iniciar el servidor de desarrollo**:
```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
lab-cv/
├── app/
│   ├── admin/
│   │   ├── cv-lab/          # Rutas principales del CV Lab
│   │   │   ├── [id]/        # Editor de CV individual
│   │   │   ├── new/         # Crear nuevo CV
│   │   │   ├── prompt/      # Editor del prompt del sistema
│   │   │   └── training/    # Módulo de entrenamiento
│   │   ├── login/           # Página de login
│   │   └── dashboard/       # Dashboard admin
│   ├── api/
│   │   ├── cv-lab/          # API routes para CV Lab
│   │   └── auth/            # OAuth callbacks
│   ├── layout.tsx           # Layout raíz
│   ├── page.tsx             # Página principal (redirect a cv-lab)
│   └── globals.css          # Estilos globales
├── components/
│   ├── cv-lab/              # Componentes del CV Lab
│   ├── admin/               # Componentes admin
│   └── ui/                  # Componentes shadcn/ui
├── lib/
│   ├── cv-lab/              # Motor de IA y lógica del CV Lab
│   │   ├── ai-engine.ts     # Integración OpenAI
│   │   ├── agent-tools.ts   # Herramientas para la IA
│   │   ├── readiness.ts     # Cálculo de score
│   │   ├── linkedin-parser.ts
│   │   ├── pdf-generator.ts
│   │   └── ...
│   ├── supabase/            # Clientes Supabase
│   ├── types/               # TypeScript types
│   └── utils/               # Utilidades
├── proxy.ts                 # Middleware de Next.js
└── .env                     # Variables de entorno
```

## 🔐 Autenticación

1. **Crear usuario admin**:

```sql
-- Desde SQL Editor de Supabase
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, role)
VALUES ('tu-email@ejemplo.com', crypt('tu-password', gen_salt('bf')), NOW(), 'authenticated');

-- Obtener el ID del usuario creado
SELECT id FROM auth.users WHERE email = 'tu-email@ejemplo.com';

-- Agregar a la tabla admins
INSERT INTO admins (id, email, full_name)
VALUES ('user-id-aqui', 'tu-email@ejemplo.com', 'Tu Nombre');
```

2. **Login**:
- Navega a `http://localhost:3000/admin/login`
- Ingresa tus credenciales
- Serás redirigido automáticamente a `/admin/cv-lab`

## 🎯 Uso

### Crear un Nuevo CV

1. Ir a `/admin/cv-lab`
2. Click en "Crear Nuevo CV"
3. Opciones:
   - **Desde cero**: Completa manualmente con ayuda de la IA
   - **Desde LinkedIn**: Conecta tu perfil (OAuth)
   - **Desde documento**: Sube un PDF o Word

### Chat con la IA (OCTAVIA)

1. En el editor de CV, usa el panel de chat a la derecha
2. Escribe lo que necesitas (ej: "Mejora mi resumen profesional")
3. La IA actualizará automáticamente tu CV
4. Revisa los cambios en la previsualización
5. Confirma o pide modificaciones

### Exportar a PDF

1. Asegúrate de que tu CV tenga un score de completitud alto
2. Click en "Exportar PDF"
3. El PDF será optimizado para sistemas ATS (Applicant Tracking Systems)

### Control de Versiones

1. Cada cambio significativo se guarda como una nueva versión
2. Accede al historial desde el botón "Versiones"
3. Restaura versiones anteriores si es necesario

## ⚙️ Configuración Avanzada

### Cambiar el Modelo de IA

Edita `.env`:
```
OPENAI_MODEL="gpt-4o"  # o "gpt-4", "gpt-3.5-turbo", etc.
```

### Personalizar el Prompt del Sistema

1. Ve a `/admin/cv-lab/prompt`
2. Edita el prompt del sistema que guía a OCTAVIA
3. Prueba diferentes versiones con A/B testing

### LinkedIn OAuth

1. Crea una app en [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Agrega el producto "Sign In with LinkedIn using OpenID Connect"
3. Configura Redirect URI: `http://localhost:3000/api/auth/callback/linkedin`
4. Actualiza `.env` con tus credenciales

## 🔄 Migración de Base de Datos (Próximamente)

**IMPORTANTE**: Por ahora, esta aplicación comparte la base de datos con `portfolio-rf`.

Cuando estés listo para migrar a una base de datos independiente:

1. Crea un nuevo proyecto en Supabase
2. Ejecuta los scripts de migración (próximamente)
3. Actualiza las variables de entorno en `.env`
4. Migra los datos existentes usando el script de migración

## 🐛 Troubleshooting

### Error: "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"
- Asegúrate de completar todas las variables de entorno en `.env`
- Reinicia el servidor de desarrollo

### Error de autenticación
- Verifica que el usuario exista en la tabla `admins`
- Verifica las credenciales de Supabase

### Error de OpenAI
- Verifica que `OPENAI_API_KEY` sea válida
- Verifica que tengas créditos disponibles en tu cuenta

## 📦 Build para Producción

```bash
pnpm build
pnpm start
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Push a GitHub
2. Importa el proyecto en Vercel
3. Configura las variables de entorno
4. Deploy automático

### Otras plataformas

Compatible con cualquier plataforma que soporte Next.js 16+.

## 📄 Licencia

Privado - Uso interno

## 🤝 Soporte

Para issues o preguntas, contacta al equipo de desarrollo.

---

**Nota**: Esta es una aplicación separada de `portfolio-rf`. Los cambios aquí NO afectarán al portfolio.
