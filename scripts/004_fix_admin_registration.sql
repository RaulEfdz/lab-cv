-- =============================================================================
-- FIX ADMIN REGISTRATION - ADD INSERT POLICY
-- =============================================================================
-- Este script añade la política de INSERT que falta en la tabla admins
-- Ejecutar en: https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/sql/new
-- =============================================================================

-- Permitir que los usuarios se registren a sí mismos en la tabla admins
CREATE POLICY "admins_insert_own"
  ON public.admins FOR INSERT
  WITH CHECK (auth.uid() = id);

-- También añadir política de UPDATE para que los admins puedan actualizar su perfil
CREATE POLICY "admins_update_own"
  ON public.admins FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- DONE!
-- =============================================================================
-- Ahora los usuarios podrán registrarse correctamente como administradores
