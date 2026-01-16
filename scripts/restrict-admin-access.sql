-- ============================================
-- RESTRICCIÓN DE ADMIN A UN SOLO EMAIL
-- Solo raulefdz@gmail.com puede tener rol 'admin'
-- ============================================

-- 1. Revocar rol de admin a todos EXCEPTO raulefdz@gmail.com
UPDATE public.profiles
SET
  role = 'user',
  updated_at = NOW()
WHERE
  role = 'admin'
  AND email != 'raulefdz@gmail.com';

-- 2. Asegurar que raulefdz@gmail.com tenga rol admin
UPDATE public.profiles
SET
  role = 'admin',
  updated_at = NOW()
WHERE
  email = 'raulefdz@gmail.com';

-- 3. Crear función que valida rol de admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND email = 'raulefdz@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recrear el trigger para asignar roles en signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT := 'user';
BEGIN
  -- Solo asignar 'admin' si el email es raulefdz@gmail.com
  IF NEW.email = 'raulefdz@gmail.com' THEN
    user_role := 'admin';
  END IF;

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

-- 5. Crear función que previene cambios no autorizados de rol
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se intenta cambiar el rol de cualquier usuario
  IF NEW.role != OLD.role THEN
    -- Solo el admin actual puede cambiar roles
    IF NOT is_admin() THEN
      RAISE EXCEPTION 'No autorizado para cambiar roles';
    END IF;

    -- Prevenir que se quite el rol de admin a raulefdz@gmail.com
    IF OLD.email = 'raulefdz@gmail.com' AND NEW.role != 'admin' THEN
      RAISE EXCEPTION 'No se puede cambiar el rol del administrador principal';
    END IF;

    -- Prevenir que se asigne admin a cualquier otro email
    IF NEW.email != 'raulefdz@gmail.com' AND NEW.role = 'admin' THEN
      RAISE EXCEPTION 'Solo raulefdz@gmail.com puede tener rol de administrador';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Aplicar trigger de prevención
DROP TRIGGER IF EXISTS check_role_changes ON public.profiles;
CREATE TRIGGER check_role_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_unauthorized_role_changes();

-- 7. Verificar configuración actual
SELECT
  email,
  role,
  created_at,
  updated_at
FROM public.profiles
ORDER BY created_at DESC;

-- ============================================
-- VERIFICACIÓN DE POLÍTICAS RLS
-- ============================================

-- Mostrar todas las políticas actuales de cv_lab_cvs
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'cv_lab_cvs'
ORDER BY policyname;

-- Mostrar políticas de otras tablas relacionadas
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('cv_lab_versions', 'cv_lab_messages', 'cv_lab_assets', 'profiles')
ORDER BY tablename, policyname;

-- ============================================
-- INSTRUCCIONES DE USO
-- ============================================

-- IMPORTANTE: Ejecutar este script en Supabase SQL Editor
--
-- Pasos:
-- 1. Copiar todo el contenido de este archivo
-- 2. Ir a Supabase Dashboard > SQL Editor
-- 3. Pegar y ejecutar
-- 4. Verificar la salida de los SELECT finales
--
-- Este script:
-- ✅ Revoca admin a todos excepto raulefdz@gmail.com
-- ✅ Asegura que raulefdz@gmail.com sea admin
-- ✅ Previene cambios no autorizados de roles
-- ✅ Actualiza el trigger de signup para respetar esta regla
-- ✅ Muestra el estado actual de usuarios y políticas
