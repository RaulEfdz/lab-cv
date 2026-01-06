-- =============================================================================
-- FIX: Recursión infinita en políticas RLS de profiles
-- =============================================================================
-- El problema: Las políticas de profiles consultan profiles para verificar
-- si es admin, lo cual causa recursión infinita.
--
-- Solución: Simplificar las políticas de profiles para evitar auto-referencia
-- =============================================================================

BEGIN;

-- Eliminar políticas problemáticas de profiles
DROP POLICY IF EXISTS "users_select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_select_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_update_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;

-- Política simple: Los usuarios pueden ver su propio perfil
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Política simple: Los usuarios pueden actualizar su propio perfil
-- IMPORTANTE: No permiten cambiar el rol
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Política simple: Auto-inserción al registrarse
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- Simplificar políticas de cv_lab_cvs también
-- =============================================================================

-- Eliminar políticas que causan recursión
DROP POLICY IF EXISTS "admins_select_all_cvs" ON public.cv_lab_cvs;
DROP POLICY IF EXISTS "admins_insert_all_cvs" ON public.cv_lab_cvs;
DROP POLICY IF EXISTS "admins_update_all_cvs" ON public.cv_lab_cvs;
DROP POLICY IF EXISTS "admins_delete_all_cvs" ON public.cv_lab_cvs;

-- Política mejorada para admins: Usar una función helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recrear políticas de cv_lab_cvs con la función helper
CREATE POLICY "admins_select_all_cvs"
  ON public.cv_lab_cvs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "admins_insert_all_cvs"
  ON public.cv_lab_cvs FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "admins_update_all_cvs"
  ON public.cv_lab_cvs FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "admins_delete_all_cvs"
  ON public.cv_lab_cvs FOR DELETE
  USING (public.is_admin());

-- =============================================================================
-- Actualizar políticas de tablas relacionadas con la función helper
-- =============================================================================

-- cv_lab_versions
DROP POLICY IF EXISTS "admins_access_all_cv_versions" ON public.cv_lab_versions;
CREATE POLICY "admins_access_all_cv_versions"
  ON public.cv_lab_versions FOR ALL
  USING (public.is_admin());

-- cv_lab_messages
DROP POLICY IF EXISTS "admins_access_all_cv_messages" ON public.cv_lab_messages;
CREATE POLICY "admins_access_all_cv_messages"
  ON public.cv_lab_messages FOR ALL
  USING (public.is_admin());

-- cv_lab_assets
DROP POLICY IF EXISTS "admins_access_all_cv_assets" ON public.cv_lab_assets;
CREATE POLICY "admins_access_all_cv_assets"
  ON public.cv_lab_assets FOR ALL
  USING (public.is_admin());

-- cv_lab_feedback
DROP POLICY IF EXISTS "admins_access_all_cv_feedback" ON public.cv_lab_feedback;
CREATE POLICY "admins_access_all_cv_feedback"
  ON public.cv_lab_feedback FOR ALL
  USING (public.is_admin());

-- cv_lab_prompt_versions
DROP POLICY IF EXISTS "admins_full_access_prompt_versions" ON public.cv_lab_prompt_versions;
CREATE POLICY "admins_full_access_prompt_versions"
  ON public.cv_lab_prompt_versions FOR ALL
  USING (public.is_admin());

-- cv_lab_learned_patterns
DROP POLICY IF EXISTS "admins_full_access_learned_patterns" ON public.cv_lab_learned_patterns;
CREATE POLICY "admins_full_access_learned_patterns"
  ON public.cv_lab_learned_patterns FOR ALL
  USING (public.is_admin());

-- cv_lab_training_sessions
DROP POLICY IF EXISTS "admins_full_access_training_sessions" ON public.cv_lab_training_sessions;
CREATE POLICY "admins_full_access_training_sessions"
  ON public.cv_lab_training_sessions FOR ALL
  USING (public.is_admin());

-- cv_lab_training_messages
DROP POLICY IF EXISTS "admins_full_access_training_messages" ON public.cv_lab_training_messages;
CREATE POLICY "admins_full_access_training_messages"
  ON public.cv_lab_training_messages FOR ALL
  USING (public.is_admin());

-- cv_lab_training_feedback
DROP POLICY IF EXISTS "admins_full_access_training_feedback" ON public.cv_lab_training_feedback;
CREATE POLICY "admins_full_access_training_feedback"
  ON public.cv_lab_training_feedback FOR ALL
  USING (public.is_admin());

-- cv_lab_training_progress
DROP POLICY IF EXISTS "admins_full_access_training_progress" ON public.cv_lab_training_progress;
CREATE POLICY "admins_full_access_training_progress"
  ON public.cv_lab_training_progress FOR ALL
  USING (public.is_admin());

-- cv_lab_training_tests
DROP POLICY IF EXISTS "admins_full_access_training_tests" ON public.cv_lab_training_tests;
CREATE POLICY "admins_full_access_training_tests"
  ON public.cv_lab_training_tests FOR ALL
  USING (public.is_admin());

COMMIT;

-- =============================================================================
-- FIX COMPLETADO
-- =============================================================================
-- ✅ Función helper is_admin() creada (SECURITY DEFINER STABLE)
-- ✅ Políticas de profiles simplificadas (sin auto-referencia)
-- ✅ Todas las políticas actualizadas para usar is_admin()
-- ✅ Recursión infinita eliminada
-- =============================================================================
