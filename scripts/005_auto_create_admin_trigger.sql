-- =============================================================================
-- AUTO-CREATE ADMIN RECORD ON USER SIGNUP
-- =============================================================================
-- Este trigger crea automáticamente un registro en la tabla admins
-- cuando se crea un nuevo usuario en auth.users
-- Ejecutar en: https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/sql/new
-- =============================================================================

-- Función que se ejecuta cuando se crea un nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admins (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que llama a la función cuando se crea un usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- DONE!
-- =============================================================================
-- Ahora cuando un usuario se registre, automáticamente se creará su registro
-- en la tabla admins, sin necesidad de hacerlo manualmente desde el código
