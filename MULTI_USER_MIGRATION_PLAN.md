# Plan de Migración a Aplicación Multi-Usuario

Este documento describe el plan completo para transformar la aplicación de un sistema de "solo administrador" a una plataforma multi-usuario (SaaS), donde cada usuario tiene su propio espacio de trabajo seguro.

---

## ✅ Fase 1: Reestructuración de la Base de Datos (Completada)

Esta fase ha sentado las bases de la nueva arquitectura.

**Estado:** **Completado** tras ejecutar el script `scripts/apply-migration.ts`.

**Cambios Realizados:**
1.  **Tabla `profiles`:** Se creó una nueva tabla `public.profiles` para gestionar los perfiles de todos los usuarios.
2.  **Columna `role`:** Esta tabla incluye una columna `role` que por defecto es `'user'`.
3.  **Asignación de Administrador:** Se implementó un disparador (trigger) que asigna automáticamente el rol `'admin'` al usuario con el correo `raulefdz@gmail.com` durante el registro.
4.  **Propiedad de los Datos:** Se añadió una columna `user_id` a la tabla `cv_lab_cvs`, asegurando que cada CV pertenezca a un usuario específico.
5.  **Seguridad a Nivel de Fila (RLS):** Se implementaron nuevas políticas de seguridad que:
    *   Permiten a los usuarios regulares (`user`) ver y editar únicamente sus propios datos.
    *   Permiten a los administradores (`admin`) acceder a todos los datos de la plataforma.

---

## 🏃‍♂️ Fase 2: Adaptación del Código de la Aplicación (Próximos Pasos)

Ahora que la base de datos está lista, debemos adaptar el código de la aplicación Next.js para que utilice la nueva estructura.

### 2.1 - Actualizar los Tipos de Datos (Types)

El código de TypeScript debe reflejar el nuevo esquema de la base de datos.

*   **Acción:** Modificar el archivo `lib/types/database.ts` para:
    *   Eliminar o comentar la interfaz `Admin`.
    *   Crear una nueva interfaz `Profile` que coincida con la tabla `public.profiles` (incluyendo `id`, `email`, `role`, etc.).
    *   Añadir la propiedad `user_id: string` a la interfaz que represente un CV (probablemente dentro de `cv-lab.ts`).
*   **Recomendación:** Generar automáticamente los tipos de Supabase para tener una fuente de verdad precisa. Esto se hace con la CLI de Supabase ejecutando un comando similar a este (necesitarás tu `project-id` de Supabase):
    ```bash
    npx supabase gen types typescript --project-id <tu-project-id> > lib/types/supabase.ts
    ```

### 2.2 - Modificar la Lógica de Creación de CVs

Al crear un nuevo CV, debemos asegurarnos de que se asigne al usuario que lo está creando.

*   **Acción:** Localizar la función que crea un nuevo CV (probablemente en un archivo `actions.ts` dentro de `app/admin/cv-lab/`).
*   **Modificación:** Al momento de insertar un nuevo registro en la tabla `cv_lab_cvs`, se debe incluir el `user_id` del usuario autenticado. Se puede obtener con `(await supabase.auth.getUser()).data.user.id`.

### 2.3 - Habilitar el Registro Público de Usuarios

Debemos permitir que nuevos usuarios se registren en la plataforma.

*   **Acción:** Crear una página de registro pública (ej. `/signup`).
*   **Lógica:** Esta página utilizará `supabase.auth.signUp()` para registrar nuevos usuarios. Gracias al trigger de la base de datos, se les asignará automáticamente el rol `'user'`.

---

## 🚀 Fase 3: Implementación de Rutas y Vistas de Usuario

Esta fase consiste en crear la experiencia de usuario para los no-administradores.

### 3.1 - Redirección Basada en Rol

Después del inicio de sesión, debemos dirigir a los usuarios al panel correcto.

*   **Acción:** Modificar la lógica de `callback` de autenticación.
*   **Lógica:**
    1.  Después de que el usuario inicie sesión, consultar la tabla `profiles` para obtener su `role`.
    2.  Si `role` es `'admin'`, redirigir a `/admin/dashboard`.
    3.  Si `role` es `'user'`, redirigir a una nueva página, por ejemplo, `/dashboard`.

### 3.2 - Crear el Panel de Usuario (`/dashboard`)

Los usuarios necesitan su propio espacio para ver y gestionar sus CVs.

*   **Acción:** Crear una nueva ruta `app/dashboard/page.tsx`.
*   **Contenido:** Esta página reutilizará componentes existentes como `CvList`, pero las funciones que obtengan los datos de Supabase traerán automáticamente solo los CVs del usuario actual gracias a las políticas RLS.

### 3.3 - Adaptar la Interfaz de Usuario (UI)

Hay que asegurarse de que los usuarios regulares no vean las opciones de administrador.

*   **Acción:** En los componentes de navegación y menús (ej. `admin-nav.tsx`), envolver los enlaces a secciones de administrador (`Gestión de Prompts`, `Training Lab`, `Usuarios`, etc.) en una condición que compruebe si el rol del usuario es `'admin'`.

---

## Siguientes Pasos Inmediatos

El plan está trazado. El siguiente paso técnico es **comenzar con la Fase 2**, empezando por la **actualización de los tipos de TypeScript en `lib/types/database.ts`** para alinear el código con nuestra nueva base de datos.
