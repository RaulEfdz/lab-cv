# Roles y Permisos - Lab CV

## 📊 Estructura Actual del Proyecto

**IMPORTANTE**: Actualmente el proyecto **solo tiene rol de ADMINISTRADOR**. No hay usuarios regulares implementados.

---

## 👨‍💼 ROL ADMINISTRADOR

Los administradores tienen acceso completo a todas las funcionalidades del sistema.

### 🔐 Autenticación
- **Login**: `/admin/login`
- **Registro**: `/admin/register`
- **Reset Password**: `/admin/reset-password`

### 📊 Dashboard
**Ruta**: `/admin/dashboard`

**Funcionalidades**:
- Ver estadísticas generales del sistema
- Resumen de CVs generados
- Resumen de usuarios del sistema
- Resumen de templates disponibles
- Acceso rápido a todas las secciones

### 🤖 CV Lab (Creación de CVs con IA)
**Ruta**: `/admin/cv-lab`

**Funcionalidades**:

#### 1. **Lista de CV Labs** (`/admin/cv-lab`)
- Ver todos los CV Labs creados
- Filtrar y buscar CV Labs
- Ver estado de cada CV (DRAFT, READY, CLOSED)
- Ver readiness score de cada CV
- Acceder a cualquier CV Lab

#### 2. **Crear Nuevo CV Lab** (`/admin/cv-lab/new`)
- Iniciar nueva sesión de CV con IA
- Definir puesto objetivo
- Definir industria
- Elegir idioma (ES/EN)
- Subir CV existente (PDF, Word, texto)
- Conectar con LinkedIn

#### 3. **Editor de CV Lab** (`/admin/cv-lab/[id]`)
- **Chat con Octavia (IA)**: Asistente conversacional para crear/mejorar CV
- **Vista previa en tiempo real**: Ver CV en formato papel A4
- **Edición manual**: Editar cualquier sección del CV directamente
- **Sistema de versiones**: Guardar hasta 5 versiones del CV
- **Readiness Score**: Puntuación de qué tan completo está el CV
- **Exportar a PDF**: Descargar CV en formato PDF profesional
- **Feedback**: Dar feedback a las respuestas de Octavia
- **Assets**: Subir documentos adicionales (LinkedIn, portfolios, etc.)

#### 4. **Gestión de Prompt** (`/admin/cv-lab/prompt`)
- Ver prompt activo de Octavia
- Ver historial de versiones de prompts
- Ver estadísticas de rendimiento del prompt
- Ver patrones aprendidos (feedback loop)
- Activar/desactivar versiones de prompts
- Crear nueva versión de prompt
- Ver changelog de cada versión

#### 5. **Training Lab** (`/admin/cv-lab/training`)
- **Entrenar a Octavia** con casos de prueba
- **10 niveles de dificultad**:
  - Nivel 1-2: Casos básicos (CV desde cero, datos simples)
  - Nivel 3-4: Casos intermedios (múltiples experiencias)
  - Nivel 5-6: Casos con gaps laborales
  - Nivel 7-8: Cambios de carrera
  - Nivel 9-10: Casos edge (20+ años experiencia, freelancers)
- **Perfiles de prueba**: 9 perfiles reales de Latinoamérica
- **Vacantes objetivo**: 10 vacantes reales para cada perfil
- **Evaluación automática**: Score de rendimiento de Octavia
- **Feedback Loop**: Mejora continua del prompt

### 📄 CVs Generados
**Ruta**: `/admin/cvs`

**Funcionalidades**:
- Ver todos los CVs generados en la plataforma
- Filtrar por usuario, fecha, template
- Ver información de cada CV:
  - Título
  - Usuario que lo creó
  - Template usado
  - Fecha de creación
  - Si fue generado con IA o manualmente
- Acciones:
  - Ver CV completo
  - Descargar PDF
  - Editar CV
  - Eliminar CV

### 👥 Usuarios
**Ruta**: `/admin/users`

**Funcionalidades**:
- Ver lista de todos los usuarios del sistema
- Ver información de cada usuario:
  - Email
  - Nombre completo
  - Fecha de registro
  - CVs creados
  - Último acceso
- Acciones:
  - Ver perfil de usuario
  - Ver CVs del usuario
  - Desactivar/activar usuario
  - Eliminar usuario

### 📋 Templates
**Ruta**: `/admin/templates`

**Funcionalidades**:
- Ver todos los templates de CV disponibles
- Previsualizar templates
- Crear nuevo template
- Editar template existente
- Activar/desactivar template
- Eliminar template
- Clonar template

---

## 👤 ROL USUARIO REGULAR (NO IMPLEMENTADO)

**Estado**: ❌ **NO EXISTE ACTUALMENTE**

### Funcionalidades Planeadas (para futuro):
Si se implementara un rol de usuario regular, tendría acceso limitado:

#### ✅ Acceso Permitido:
- Crear sus propios CVs
- Usar CV Lab (Octavia IA) para sus CVs
- Ver historial de sus CVs
- Editar sus CVs
- Descargar sus CVs en PDF
- Gestionar sus versiones de CV (máximo 5)
- Dar feedback a Octavia
- Conectar su LinkedIn
- Subir documentos personales

#### ❌ Acceso Denegado:
- Ver CVs de otros usuarios
- Ver panel de administración
- Gestionar prompts de Octavia
- Acceder al Training Lab
- Ver estadísticas globales
- Gestionar usuarios
- Gestionar templates (solo usar los existentes)

---

## 🗄️ Base de Datos - Tablas por Rol

### Tablas de Administradores:
```sql
- admins                          -- Datos de administradores
- cv_lab_prompt_versions          -- Versiones del prompt de Octavia
- cv_lab_learned_patterns         -- Patrones aprendidos (feedback loop)
- cv_lab_training_sessions        -- Sesiones de entrenamiento
- cv_lab_training_messages        -- Mensajes del training
- cv_lab_training_feedback        -- Feedback del training
- cv_lab_training_progress        -- Progreso en niveles de training
- cv_lab_training_tests           -- Tests de evaluación
```

### Tablas Compartidas (Admin tiene acceso total):
```sql
- cv_lab_cvs                      -- CVs creados (actualmente solo admin)
- cv_lab_versions                 -- Versiones de CVs
- cv_lab_messages                 -- Mensajes del chat con Octavia
- cv_lab_assets                   -- Archivos subidos (LinkedIn, docs)
- cv_lab_feedback                 -- Feedback a Octavia
```

### Tablas de Usuarios (NO EXISTEN):
```sql
- users                           -- ❌ NO IMPLEMENTADO
- cv_templates                    -- ❌ NO IMPLEMENTADO
- cvs                             -- ❌ NO IMPLEMENTADO (diferente de cv_lab_cvs)
```

---

## 🔒 Sistema de Permisos (RLS - Row Level Security)

### Políticas Actuales:

#### Administradores (`admins`):
- ✅ Pueden ver su propio perfil
- ✅ Pueden actualizar su propio perfil
- ✅ Auto-registro permitido

#### CV Lab (`cv_lab_*`):
- ✅ Solo usuarios autenticados (admins) tienen acceso completo
- ✅ Política: `auth.role() = 'authenticated'`

### Políticas Futuras (si se implementan usuarios):

#### Usuarios Regulares:
- 🔜 Solo pueden ver/editar sus propios CVs
- 🔜 No pueden ver CVs de otros usuarios
- 🔜 No pueden acceder a tablas de administración

---

## 🚀 Resumen

### Estado Actual:
| Rol | Implementado | Acceso |
|-----|--------------|--------|
| **Administrador** | ✅ SÍ | Acceso completo al sistema |
| **Usuario Regular** | ❌ NO | No implementado |

### URL Base del Proyecto:
- **Producción**: https://lab-4h52uds1g-raulefdzs-projects.vercel.app
- **Login Admin**: https://lab-4h52uds1g-raulefdzs-projects.vercel.app/admin/login
- **Dashboard**: https://lab-4h52uds1g-raulefdzs-projects.vercel.app/admin/dashboard
- **CV Lab**: https://lab-4h52uds1g-raulefdzs-projects.vercel.app/admin/cv-lab

---

**Última actualización**: 2026-01-06
**Versión de Octavia**: v4.3-edit-support
