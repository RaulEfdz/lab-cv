-- =============================================================================
-- CREAR USUARIO ADMIN PARA CV LAB
-- =============================================================================
-- Ejecutar DESPUÉS de 001_setup_cv_lab_database.sql
--
-- INSTRUCCIONES:
-- 1. Ve a: https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/auth/users
-- 2. Click en "Add user" → "Create new user"
-- 3. Ingresa tu email y contraseña
-- 4. Confirma el email automáticamente
-- 5. Copia el USER ID que se genera
-- 6. Reemplaza 'TU-USER-ID-AQUI' abajo con ese ID
-- 7. Ejecuta este script en SQL Editor
-- =============================================================================

-- Insertar en tabla admins
INSERT INTO public.admins (id, email, full_name)
VALUES (
    'TU-USER-ID-AQUI'::uuid,  -- <-- Reemplazar con tu User ID de Supabase Auth
    'tu-email@ejemplo.com',    -- <-- Tu email
    'Tu Nombre Completo'       -- <-- Tu nombre
);

-- Verificar que se creó correctamente
SELECT * FROM public.admins;

-- =============================================================================
-- ALTERNATIVA: Crear usuario directamente en auth.users (si prefieres)
-- =============================================================================
-- NOTA: Este método es más avanzado y requiere el Service Role Key
-- Solo usar si el método anterior no funciona

-- Paso 1: Crear usuario en auth.users
-- INSERT INTO auth.users (
--     email,
--     encrypted_password,
--     email_confirmed_at,
--     role,
--     raw_app_meta_data,
--     raw_user_meta_data
-- )
-- VALUES (
--     'tu-email@ejemplo.com',
--     crypt('tu-password-seguro', gen_salt('bf')),
--     NOW(),
--     'authenticated',
--     '{"provider": "email", "providers": ["email"]}',
--     '{"full_name": "Tu Nombre"}'
-- )
-- RETURNING id;

-- Paso 2: Copiar el ID que se genera y ejecutar:
-- INSERT INTO public.admins (id, email, full_name)
-- VALUES (
--     'EL-ID-GENERADO-AQUI'::uuid,
--     'tu-email@ejemplo.com',
--     'Tu Nombre Completo'
-- );
