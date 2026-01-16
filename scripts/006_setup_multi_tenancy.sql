-- =============================================================================
-- MIGRACIÓN A MULTI-TENANCY (Multi-Usuario)
-- =============================================================================
-- Este script transforma la aplicación de "solo admin" a una plataforma
-- multi-usuario donde cada usuario tiene su propio espacio de trabajo seguro.
--
-- EJECUTAR: npx tsx scripts/apply-migration.ts
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. CREAR TABLA PROFILES (Reemplaza tabla admins)
-- =============================================================================

-- Crear tabla profiles para todos los usuarios
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
-- Los usuarios pueden ver su propio perfil
CREATE POLICY "users_select_own_profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Los admins pueden ver todos los perfiles
CREATE POLICY "admins_select_all_profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "users_update_own_profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Los admins pueden actualizar cualquier perfil
CREATE POLICY "admins_update_all_profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los usuarios pueden insertar su propio perfil al registrarse
CREATE POLICY "users_insert_own_profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- 2. MIGRAR DATOS DE ADMINS A PROFILES
-- =============================================================================

-- Insertar admins existentes en profiles con rol 'admin'
INSERT INTO public.profiles (id, email, full_name, role, created_at)
SELECT id, email, full_name, 'admin', created_at
FROM public.admins
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. TRIGGER PARA AUTO-CREAR PROFILE AL REGISTRARSE
-- =============================================================================

-- Función que crea automáticamente un profile cuando se crea un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT := 'user';
BEGIN
  -- Por defecto, todos los usuarios nuevos tienen rol 'user'
  -- Los admins deben ser promovidos manualmente por otro admin
  -- o asignados en el registro inicial del sistema

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

-- Reemplazar el trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- =============================================================================
-- 4. AGREGAR COLUMNA user_id A cv_lab_cvs
-- =============================================================================

-- Agregar columna user_id si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'cv_lab_cvs'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.cv_lab_cvs
    ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

    -- Crear índice para mejorar performance
    CREATE INDEX idx_cv_lab_cvs_user_id ON public.cv_lab_cvs(user_id);
  END IF;
END $$;

-- Asignar CVs existentes al primer admin (migración de datos legacy)
UPDATE public.cv_lab_cvs
SET user_id = (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)
WHERE user_id IS NULL;

-- Hacer la columna NOT NULL después de asignar valores
ALTER TABLE public.cv_lab_cvs
ALTER COLUMN user_id SET NOT NULL;

-- =============================================================================
-- 5. ACTUALIZAR POLÍTICAS RLS DE cv_lab_cvs
-- =============================================================================

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Admin full access to cv_lab_cvs" ON cv_lab_cvs;

-- Los usuarios solo pueden ver sus propios CVs
CREATE POLICY "users_select_own_cvs"
  ON public.cv_lab_cvs FOR SELECT
  USING (user_id = auth.uid());

-- Los admins pueden ver todos los CVs
CREATE POLICY "admins_select_all_cvs"
  ON public.cv_lab_cvs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los usuarios solo pueden insertar CVs para sí mismos
CREATE POLICY "users_insert_own_cvs"
  ON public.cv_lab_cvs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Los admins pueden insertar CVs para cualquier usuario
CREATE POLICY "admins_insert_all_cvs"
  ON public.cv_lab_cvs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los usuarios solo pueden actualizar sus propios CVs
CREATE POLICY "users_update_own_cvs"
  ON public.cv_lab_cvs FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Los admins pueden actualizar todos los CVs
CREATE POLICY "admins_update_all_cvs"
  ON public.cv_lab_cvs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los usuarios solo pueden eliminar sus propios CVs
CREATE POLICY "users_delete_own_cvs"
  ON public.cv_lab_cvs FOR DELETE
  USING (user_id = auth.uid());

-- Los admins pueden eliminar todos los CVs
CREATE POLICY "admins_delete_all_cvs"
  ON public.cv_lab_cvs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- 6. ACTUALIZAR POLÍTICAS RLS DE TABLAS RELACIONADAS
-- =============================================================================

-- cv_lab_versions: Los usuarios solo pueden ver versiones de sus CVs
DROP POLICY IF EXISTS "Admin full access to cv_lab_versions" ON cv_lab_versions;

CREATE POLICY "users_access_own_cv_versions"
  ON public.cv_lab_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cv_lab_cvs
      WHERE cv_lab_cvs.id = cv_lab_versions.cv_id
      AND cv_lab_cvs.user_id = auth.uid()
    )
  );

CREATE POLICY "admins_access_all_cv_versions"
  ON public.cv_lab_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- cv_lab_messages: Los usuarios solo pueden ver mensajes de sus CVs
DROP POLICY IF EXISTS "Admin full access to cv_lab_messages" ON cv_lab_messages;

CREATE POLICY "users_access_own_cv_messages"
  ON public.cv_lab_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cv_lab_cvs
      WHERE cv_lab_cvs.id = cv_lab_messages.cv_id
      AND cv_lab_cvs.user_id = auth.uid()
    )
  );

CREATE POLICY "admins_access_all_cv_messages"
  ON public.cv_lab_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- cv_lab_assets: Los usuarios solo pueden ver assets de sus CVs
DROP POLICY IF EXISTS "Admin full access to cv_lab_assets" ON cv_lab_assets;

CREATE POLICY "users_access_own_cv_assets"
  ON public.cv_lab_assets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cv_lab_cvs
      WHERE cv_lab_cvs.id = cv_lab_assets.cv_id
      AND cv_lab_cvs.user_id = auth.uid()
    )
  );

CREATE POLICY "admins_access_all_cv_assets"
  ON public.cv_lab_assets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- cv_lab_feedback: Los usuarios solo pueden dar feedback a sus CVs
DROP POLICY IF EXISTS "Admin full access to cv_lab_feedback" ON cv_lab_feedback;

CREATE POLICY "users_access_own_cv_feedback"
  ON public.cv_lab_feedback FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cv_lab_cvs
      WHERE cv_lab_cvs.id = cv_lab_feedback.cv_id
      AND cv_lab_cvs.user_id = auth.uid()
    )
  );

CREATE POLICY "admins_access_all_cv_feedback"
  ON public.cv_lab_feedback FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- 7. POLÍTICAS PARA TABLAS DE ADMINISTRACIÓN (Solo admins)
-- =============================================================================

-- cv_lab_prompt_versions: Solo admins
DROP POLICY IF EXISTS "Admin full access to cv_lab_prompt_versions" ON cv_lab_prompt_versions;

CREATE POLICY "admins_full_access_prompt_versions"
  ON public.cv_lab_prompt_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- cv_lab_learned_patterns: Solo admins
DROP POLICY IF EXISTS "Admin full access to cv_lab_learned_patterns" ON cv_lab_learned_patterns;

CREATE POLICY "admins_full_access_learned_patterns"
  ON public.cv_lab_learned_patterns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- cv_lab_training_*: Solo admins
DROP POLICY IF EXISTS "Admin full access to cv_lab_training_sessions" ON cv_lab_training_sessions;
DROP POLICY IF EXISTS "Admin full access to cv_lab_training_messages" ON cv_lab_training_messages;
DROP POLICY IF EXISTS "Admin full access to cv_lab_training_feedback" ON cv_lab_training_feedback;
DROP POLICY IF EXISTS "Admin full access to cv_lab_training_progress" ON cv_lab_training_progress;
DROP POLICY IF EXISTS "Admin full access to cv_lab_training_tests" ON cv_lab_training_tests;

CREATE POLICY "admins_full_access_training_sessions"
  ON public.cv_lab_training_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admins_full_access_training_messages"
  ON public.cv_lab_training_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admins_full_access_training_feedback"
  ON public.cv_lab_training_feedback FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admins_full_access_training_progress"
  ON public.cv_lab_training_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admins_full_access_training_tests"
  ON public.cv_lab_training_tests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMIT;

-- =============================================================================
-- MIGRACIÓN COMPLETADA
-- =============================================================================
--
-- ✅ Tabla profiles creada con columna role
-- ✅ Datos migrados de admins a profiles
-- ✅ Trigger para auto-asignar roles al registrarse
-- ✅ Columna user_id agregada a cv_lab_cvs
-- ✅ Políticas RLS actualizadas para multi-tenancy
-- ✅ Usuarios regulares solo pueden ver/editar sus datos
-- ✅ Administradores tienen acceso completo
--
-- PRÓXIMOS PASOS:
-- 1. Actualizar tipos en lib/types/database.ts
-- 2. Modificar lógica de creación de CVs para incluir user_id
-- 3. Crear ruta pública de registro (/signup)
-- 4. Implementar redirección basada en rol
-- 5. Crear panel de usuario (/dashboard)
-- =============================================================================
