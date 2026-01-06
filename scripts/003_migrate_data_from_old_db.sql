-- =============================================================================
-- MIGRACIÓN DE DATOS DE LA BASE DE DATOS ANTIGUA A LA NUEVA
-- =============================================================================
-- Este script migra todos los datos del CV Lab desde la BD antigua (portfolio-rf)
-- a la nueva BD de CV Lab
--
-- IMPORTANTE:
-- - NO ejecutar hasta que hayas validado que la nueva BD funciona correctamente
-- - Este script NO elimina datos de la BD antigua, solo los copia
-- - Requiere tener ambas conexiones configuradas
--
-- MÉTODO DE EJECUCIÓN:
-- Opción 1: Usar psql con dos conexiones
-- Opción 2: Usar el script automatizado migrate_cv_data.sh
-- Opción 3: Ejecutar manualmente sección por sección
-- =============================================================================

-- VARIABLES (reemplazar con tus credenciales)
-- BD ANTIGUA: postgresql://postgres.psbcfrlomloecqsyhmed:FS4ozgX4q9QmimEO@aws-1-us-east-1.pooler.supabase.com:5432/postgres
-- BD NUEVA:   postgresql://postgres.ygvzkfotrdqyehiqljle:20fdDdgK8X20R159@db.ygvzkfotrdqyehiqljle.supabase.co:5432/postgres

-- =============================================================================
-- PASO 1: EXPORTAR DATOS DE LA BD ANTIGUA
-- =============================================================================
-- Ejecutar estos comandos en la BD ANTIGUA para exportar los datos

\copy (SELECT * FROM cv_lab_cvs ORDER BY created_at) TO '/tmp/cv_lab_cvs.csv' CSV HEADER;
\copy (SELECT * FROM cv_lab_versions ORDER BY created_at) TO '/tmp/cv_lab_versions.csv' CSV HEADER;
\copy (SELECT * FROM cv_lab_messages ORDER BY created_at) TO '/tmp/cv_lab_messages.csv' CSV HEADER;
\copy (SELECT * FROM cv_lab_assets ORDER BY created_at) TO '/tmp/cv_lab_assets.csv' CSV HEADER;
\copy (SELECT * FROM cv_lab_feedback ORDER BY created_at) TO '/tmp/cv_lab_feedback.csv' CSV HEADER;
\copy (SELECT * FROM cv_lab_prompt_versions ORDER BY created_at) TO '/tmp/cv_lab_prompt_versions.csv' CSV HEADER;
\copy (SELECT * FROM cv_lab_learned_patterns ORDER BY created_at) TO '/tmp/cv_lab_learned_patterns.csv' CSV HEADER;
\copy (SELECT * FROM cv_lab_training_sessions ORDER BY created_at) TO '/tmp/cv_lab_training_sessions.csv' CSV HEADER;
\copy (SELECT * FROM cv_lab_training_messages ORDER BY created_at) TO '/tmp/cv_lab_training_messages.csv' CSV HEADER;
\copy (SELECT * FROM cv_lab_training_feedback ORDER BY created_at) TO '/tmp/cv_lab_training_feedback.csv' CSV HEADER;
\copy (SELECT * FROM cv_lab_training_progress ORDER BY created_at) TO '/tmp/cv_lab_training_progress.csv' CSV HEADER;
\copy (SELECT * FROM cv_lab_training_tests ORDER BY created_at) TO '/tmp/cv_lab_training_tests.csv' CSV HEADER;

-- =============================================================================
-- PASO 2: IMPORTAR DATOS A LA BD NUEVA
-- =============================================================================
-- Ejecutar estos comandos en la BD NUEVA para importar los datos

\copy cv_lab_cvs FROM '/tmp/cv_lab_cvs.csv' CSV HEADER;
\copy cv_lab_versions FROM '/tmp/cv_lab_versions.csv' CSV HEADER;
\copy cv_lab_messages FROM '/tmp/cv_lab_messages.csv' CSV HEADER;
\copy cv_lab_assets FROM '/tmp/cv_lab_assets.csv' CSV HEADER;
\copy cv_lab_feedback FROM '/tmp/cv_lab_feedback.csv' CSV HEADER;
\copy cv_lab_prompt_versions FROM '/tmp/cv_lab_prompt_versions.csv' CSV HEADER;
\copy cv_lab_learned_patterns FROM '/tmp/cv_lab_learned_patterns.csv' CSV HEADER;
\copy cv_lab_training_sessions FROM '/tmp/cv_lab_training_sessions.csv' CSV HEADER;
\copy cv_lab_training_messages FROM '/tmp/cv_lab_training_messages.csv' CSV HEADER;
\copy cv_lab_training_feedback FROM '/tmp/cv_lab_training_feedback.csv' CSV HEADER;
\copy cv_lab_training_progress FROM '/tmp/cv_lab_training_progress.csv' CSV HEADER;
\copy cv_lab_training_tests FROM '/tmp/cv_lab_training_tests.csv' CSV HEADER;

-- =============================================================================
-- PASO 3: VERIFICAR LA MIGRACIÓN
-- =============================================================================
-- Ejecutar estas queries en ambas BDs para comparar

SELECT
    'cv_lab_cvs' as table_name,
    COUNT(*) as row_count
FROM cv_lab_cvs
UNION ALL
SELECT 'cv_lab_versions', COUNT(*) FROM cv_lab_versions
UNION ALL
SELECT 'cv_lab_messages', COUNT(*) FROM cv_lab_messages
UNION ALL
SELECT 'cv_lab_assets', COUNT(*) FROM cv_lab_assets
UNION ALL
SELECT 'cv_lab_feedback', COUNT(*) FROM cv_lab_feedback
UNION ALL
SELECT 'cv_lab_prompt_versions', COUNT(*) FROM cv_lab_prompt_versions
UNION ALL
SELECT 'cv_lab_learned_patterns', COUNT(*) FROM cv_lab_learned_patterns
UNION ALL
SELECT 'cv_lab_training_sessions', COUNT(*) FROM cv_lab_training_sessions
UNION ALL
SELECT 'cv_lab_training_messages', COUNT(*) FROM cv_lab_training_messages
UNION ALL
SELECT 'cv_lab_training_feedback', COUNT(*) FROM cv_lab_training_feedback
UNION ALL
SELECT 'cv_lab_training_progress', COUNT(*) FROM cv_lab_training_progress
UNION ALL
SELECT 'cv_lab_training_tests', COUNT(*) FROM cv_lab_training_tests
ORDER BY table_name;

-- =============================================================================
-- PASO 4: VERIFICAR RELACIONES E INTEGRIDAD
-- =============================================================================

-- Verificar que todos los CVs tienen su current_version_id correcto
SELECT
    COUNT(*) as cvs_sin_version_actual
FROM cv_lab_cvs
WHERE current_version_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM cv_lab_versions
    WHERE id = cv_lab_cvs.current_version_id
  );

-- Debe retornar 0

-- Verificar que todos los mensajes tienen un CV válido
SELECT
    COUNT(*) as mensajes_huerfanos
FROM cv_lab_messages
WHERE NOT EXISTS (
    SELECT 1 FROM cv_lab_cvs
    WHERE id = cv_lab_messages.cv_id
);

-- Debe retornar 0

-- =============================================================================
-- NOTAS IMPORTANTES
-- =============================================================================
-- 1. Los archivos CSV se crean en /tmp/ por defecto
-- 2. Si estás en Windows, usa rutas como 'C:/temp/cv_lab_cvs.csv'
-- 3. Si hay errores de permisos, ejecuta con sudo o usa otra ubicación
-- 4. Los datos de la BD antigua NO se eliminan, solo se copian
-- 5. Puedes ejecutar la migración múltiples veces (los duplicados se ignorarán por las PKs)
