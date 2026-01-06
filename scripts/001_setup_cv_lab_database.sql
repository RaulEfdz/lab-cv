-- =============================================================================
-- CV LAB - COMPLETE DATABASE SETUP
-- =============================================================================
-- Este script crea todas las tablas necesarias para CV Lab en la nueva BD
-- Ejecutar en: https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/sql/new
--
-- ORDEN DE EJECUCIÓN:
-- 1. Este script (001_setup_cv_lab_database.sql)
-- 2. 002_create_admin_user.sql (crear tu usuario admin)
-- 3. 003_migrate_data.sql (cuando estés listo para migrar datos)
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ADMIN TABLE (para autenticación)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Solo los admins pueden ver otros admins
CREATE POLICY "admins_select_own"
  ON public.admins FOR SELECT
  USING (auth.uid() = id);

-- Permitir que los usuarios se registren a sí mismos
CREATE POLICY "admins_insert_own"
  ON public.admins FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Permitir que los admins actualicen su propio perfil
CREATE POLICY "admins_update_own"
  ON public.admins FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- AUTO-CREATE ADMIN TRIGGER
-- =============================================================================
-- Función que crea automáticamente un registro en admins cuando se crea un usuario
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

-- Trigger que ejecuta la función cuando se crea un usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- CV LAB STATUS TYPE
-- =============================================================================
DO $$ BEGIN
    CREATE TYPE cv_lab_status AS ENUM ('DRAFT', 'READY', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- CV LAB MAIN TABLES
-- =============================================================================

-- 1. CV Main Table
CREATE TABLE IF NOT EXISTS cv_lab_cvs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    target_role TEXT,
    industry TEXT,
    language VARCHAR(10) DEFAULT 'es',
    status cv_lab_status DEFAULT 'DRAFT' NOT NULL,
    readiness_score INTEGER DEFAULT 0 CHECK (readiness_score >= 0 AND readiness_score <= 100),
    current_version_id UUID,
    cv_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. CV Versions Table (max 5 per CV)
CREATE TABLE IF NOT EXISTS cv_lab_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cv_id UUID REFERENCES cv_lab_cvs(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    cv_json JSONB NOT NULL,
    render_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(cv_id, version_number)
);

-- Add foreign key for current_version_id
ALTER TABLE cv_lab_cvs
    DROP CONSTRAINT IF EXISTS cv_lab_cvs_current_version_fkey;
ALTER TABLE cv_lab_cvs
    ADD CONSTRAINT cv_lab_cvs_current_version_fkey
    FOREIGN KEY (current_version_id) REFERENCES cv_lab_versions(id) ON DELETE SET NULL;

-- 3. Chat Messages Table
CREATE TABLE IF NOT EXISTS cv_lab_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cv_id UUID REFERENCES cv_lab_cvs(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Document Assets Table (imported PDFs/DOCXs)
CREATE TABLE IF NOT EXISTS cv_lab_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cv_id UUID REFERENCES cv_lab_cvs(id) ON DELETE CASCADE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_key TEXT NOT NULL,
    mime_type VARCHAR(100),
    extracted_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- FEEDBACK SYSTEM TABLES
-- =============================================================================

-- 5. Feedback Table
CREATE TABLE IF NOT EXISTS cv_lab_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES cv_lab_messages(id) ON DELETE CASCADE NOT NULL,
    cv_id UUID REFERENCES cv_lab_cvs(id) ON DELETE CASCADE NOT NULL,
    feedback_type VARCHAR(20) NOT NULL DEFAULT 'rating',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    preferred_over_message_id UUID REFERENCES cv_lab_messages(id) ON DELETE SET NULL,
    correction_text TEXT,
    tags TEXT[] DEFAULT '{}',
    comment TEXT,
    user_intent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. Prompt Versions Table
CREATE TABLE IF NOT EXISTS cv_lab_prompt_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version VARCHAR(20) NOT NULL UNIQUE,
    system_prompt TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    positive_ratings INTEGER DEFAULT 0,
    negative_ratings INTEGER DEFAULT 0,
    ab_test_group VARCHAR(10),
    changelog TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. Learned Patterns Table
CREATE TABLE IF NOT EXISTS cv_lab_learned_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern_type VARCHAR(50) NOT NULL,
    pattern TEXT NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 0.5,
    reinforcement_count INTEGER DEFAULT 1,
    category VARCHAR(50) DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    examples JSONB DEFAULT '[]',
    learned_instruction TEXT,
    good_example TEXT,
    bad_example TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- TRAINING SYSTEM TABLES
-- =============================================================================

-- 8. Training Sessions
CREATE TABLE IF NOT EXISTS cv_lab_training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 9. Training Messages
CREATE TABLE IF NOT EXISTS cv_lab_training_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES cv_lab_training_sessions(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 10. Training Feedback
CREATE TABLE IF NOT EXISTS cv_lab_training_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES cv_lab_training_messages(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES cv_lab_training_sessions(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 11. Training Progress
CREATE TABLE IF NOT EXISTS cv_lab_training_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    current_level INTEGER DEFAULT 1,
    completed_levels INTEGER[] DEFAULT '{}',
    level_scores JSONB DEFAULT '{}',
    total_score INTEGER DEFAULT 0,
    skills_learned TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Training Tests
CREATE TABLE IF NOT EXISTS cv_lab_training_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level INTEGER NOT NULL,
    scenario_id VARCHAR(50) NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    passed BOOLEAN DEFAULT false,
    score INTEGER DEFAULT 0,
    feedback TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- CV Lab indexes
CREATE INDEX IF NOT EXISTS idx_cv_lab_cvs_status ON cv_lab_cvs(status);
CREATE INDEX IF NOT EXISTS idx_cv_lab_cvs_created_at ON cv_lab_cvs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cv_lab_versions_cv_id ON cv_lab_versions(cv_id);
CREATE INDEX IF NOT EXISTS idx_cv_lab_versions_number ON cv_lab_versions(cv_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_cv_lab_messages_cv_id ON cv_lab_messages(cv_id);
CREATE INDEX IF NOT EXISTS idx_cv_lab_messages_created_at ON cv_lab_messages(cv_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_cv_lab_assets_cv_id ON cv_lab_assets(cv_id);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_cv_lab_feedback_message ON cv_lab_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_cv_lab_feedback_cv ON cv_lab_feedback(cv_id);
CREATE INDEX IF NOT EXISTS idx_cv_lab_feedback_rating ON cv_lab_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_cv_lab_feedback_type ON cv_lab_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_cv_lab_prompt_active ON cv_lab_prompt_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_cv_lab_patterns_type ON cv_lab_learned_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_cv_lab_patterns_category ON cv_lab_learned_patterns(category);

-- Training indexes
CREATE INDEX IF NOT EXISTS idx_training_messages_session ON cv_lab_training_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_training_messages_created ON cv_lab_training_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_training_feedback_message ON cv_lab_training_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_training_feedback_session ON cv_lab_training_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_training_feedback_rating ON cv_lab_training_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_training_tests_level ON cv_lab_training_tests(level);
CREATE INDEX IF NOT EXISTS idx_training_tests_passed ON cv_lab_training_tests(passed);
CREATE INDEX IF NOT EXISTS idx_training_progress_updated ON cv_lab_training_progress(updated_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE cv_lab_cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_lab_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_lab_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_lab_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_lab_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_lab_prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_lab_learned_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_lab_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_lab_training_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_lab_training_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_lab_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_lab_training_tests ENABLE ROW LEVEL SECURITY;

-- Policies: Authenticated users (admins) can do everything
CREATE POLICY "Admin full access to cv_lab_cvs" ON cv_lab_cvs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access to cv_lab_versions" ON cv_lab_versions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access to cv_lab_messages" ON cv_lab_messages
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access to cv_lab_assets" ON cv_lab_assets
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "auth_feedback" ON cv_lab_feedback
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_prompts" ON cv_lab_prompt_versions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_patterns" ON cv_lab_learned_patterns
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Training policies (public access for training API)
CREATE POLICY "auth_training_sessions" ON cv_lab_training_sessions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_training_messages" ON cv_lab_training_messages
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_training_feedback" ON cv_lab_training_feedback
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "public_training_sessions" ON cv_lab_training_sessions
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "public_training_messages" ON cv_lab_training_messages
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "public_training_feedback" ON cv_lab_training_feedback
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_training_progress" ON cv_lab_training_progress FOR ALL USING (true);
CREATE POLICY "allow_all_training_tests" ON cv_lab_training_tests FOR ALL USING (true);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

CREATE OR REPLACE FUNCTION update_cv_lab_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CV Lab triggers
DROP TRIGGER IF EXISTS cv_lab_cvs_updated_at ON cv_lab_cvs;
CREATE TRIGGER cv_lab_cvs_updated_at
    BEFORE UPDATE ON cv_lab_cvs
    FOR EACH ROW
    EXECUTE FUNCTION update_cv_lab_updated_at();

-- Feedback triggers
DROP TRIGGER IF EXISTS cv_lab_prompt_versions_updated_at ON cv_lab_prompt_versions;
CREATE TRIGGER cv_lab_prompt_versions_updated_at
    BEFORE UPDATE ON cv_lab_prompt_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_cv_lab_updated_at();

DROP TRIGGER IF EXISTS cv_lab_learned_patterns_updated_at ON cv_lab_learned_patterns;
CREATE TRIGGER cv_lab_learned_patterns_updated_at
    BEFORE UPDATE ON cv_lab_learned_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_cv_lab_updated_at();

-- Training triggers
DROP TRIGGER IF EXISTS cv_lab_training_sessions_updated_at ON cv_lab_training_sessions;
CREATE TRIGGER cv_lab_training_sessions_updated_at
    BEFORE UPDATE ON cv_lab_training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_cv_lab_updated_at();

-- =============================================================================
-- INSERT DEFAULT DATA
-- =============================================================================

-- Insert default prompt version
INSERT INTO cv_lab_prompt_versions (version, system_prompt, is_active, changelog)
VALUES (
    'v1.0',
    'Eres un experto en redaccion de CVs y curriculums profesionales. Tu rol es ayudar a crear, editar y optimizar CVs para aplicaciones de trabajo.

## REGLAS ABSOLUTAS:
1. NUNCA inventes datos - si falta informacion, PREGUNTA
2. SIEMPRE pide metricas cuantificables (%, $, numeros)
3. Formato STAR para logros (Situacion, Tarea, Accion, Resultado)
4. Optimiza para ATS (keywords del puesto)
5. Tono profesional consistente

## VERBOS DE ACCION:
Logre, Aumente, Reduje, Implemente, Desarrolle, Lidere, Optimice, Automatice

## READINESS SCORE:
+10 summary claro | +20 experiencias con bullets | +20 metricas | +10 skills | +10 header completo
Umbral "Listo": 80+',
    true,
    'Version inicial del prompt para CV Lab'
) ON CONFLICT (version) DO NOTHING;

-- Insert initial training progress record
INSERT INTO cv_lab_training_progress (current_level, completed_levels, total_score, skills_learned)
VALUES (1, '{}', 0, '{}')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE cv_lab_cvs IS 'Main CV records for the CV Lab feature';
COMMENT ON TABLE cv_lab_versions IS 'Version history for each CV (max 5 versions per CV)';
COMMENT ON TABLE cv_lab_messages IS 'Chat history between user and AI assistant';
COMMENT ON TABLE cv_lab_assets IS 'Uploaded documents (PDF/DOCX) for CV extraction';
COMMENT ON TABLE cv_lab_feedback IS 'User feedback on AI responses for continuous improvement';
COMMENT ON TABLE cv_lab_prompt_versions IS 'Version history of system prompts with performance metrics';
COMMENT ON TABLE cv_lab_learned_patterns IS 'Patterns learned from user feedback to improve responses';
COMMENT ON TABLE cv_lab_training_sessions IS 'Training sessions for testing and improving the CV Lab AI agent via API';
COMMENT ON TABLE cv_lab_training_messages IS 'Messages exchanged during training sessions';
COMMENT ON TABLE cv_lab_training_feedback IS 'Feedback provided on training messages to improve the AI';
COMMENT ON TABLE cv_lab_training_progress IS 'AI training progress through 10 levels';
COMMENT ON TABLE cv_lab_training_tests IS 'Individual test results for training scenarios';

-- =============================================================================
-- DONE!
-- =============================================================================
-- Ahora puedes ejecutar el script 002_create_admin_user.sql para crear tu usuario
