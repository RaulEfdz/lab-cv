#!/bin/bash

# =============================================================================
# SCRIPT DE MIGRACIÓN AUTOMATIZADA DE DATOS CV LAB
# =============================================================================
# Este script migra todos los datos del CV Lab desde la BD antigua a la nueva
#
# USO:
#   chmod +x migrate_cv_data.sh
#   ./migrate_cv_data.sh
#
# REQUISITOS:
#   - psql instalado
#   - Acceso a ambas bases de datos
# =============================================================================

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =============================================================================
# CONFIGURACIÓN - Actualizar con tus credenciales
# =============================================================================

# Base de datos ANTIGUA (portfolio-rf)
OLD_DB_HOST="aws-1-us-east-1.pooler.supabase.com"
OLD_DB_PORT="5432"
OLD_DB_NAME="postgres"
OLD_DB_USER="postgres.psbcfrlomloecqsyhmed"
OLD_DB_PASS="FS4ozgX4q9QmimEO"
OLD_DB_URL="postgresql://${OLD_DB_USER}:${OLD_DB_PASS}@${OLD_DB_HOST}:${OLD_DB_PORT}/${OLD_DB_NAME}"

# Base de datos NUEVA (lab-cv)
NEW_DB_HOST="db.ygvzkfotrdqyehiqljle.supabase.co"
NEW_DB_PORT="5432"
NEW_DB_NAME="postgres"
NEW_DB_USER="postgres.ygvzkfotrdqyehiqljle"
NEW_DB_PASS="20fdDdgK8X20R159"
NEW_DB_URL="postgresql://${NEW_DB_USER}:${NEW_DB_PASS}@${NEW_DB_HOST}:${NEW_DB_PORT}/${NEW_DB_NAME}"

# Directorio temporal para archivos CSV
TMP_DIR="/tmp/cv_lab_migration"

# =============================================================================
# FUNCIONES
# =============================================================================

print_step() {
    echo -e "${GREEN}==>${NC} $1"
}

print_error() {
    echo -e "${RED}ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}WARNING:${NC} $1"
}

check_prerequisites() {
    print_step "Verificando prerequisitos..."

    if ! command -v psql &> /dev/null; then
        print_error "psql no está instalado. Instálalo con: brew install postgresql"
        exit 1
    fi

    print_step "✓ psql está instalado"
}

create_temp_dir() {
    print_step "Creando directorio temporal..."
    mkdir -p "$TMP_DIR"
    print_step "✓ Directorio creado: $TMP_DIR"
}

test_connections() {
    print_step "Probando conexión a BD antigua..."
    if psql "$OLD_DB_URL" -c "SELECT 1;" &> /dev/null; then
        print_step "✓ Conexión exitosa a BD antigua"
    else
        print_error "No se pudo conectar a la BD antigua"
        exit 1
    fi

    print_step "Probando conexión a BD nueva..."
    if psql "$NEW_DB_URL" -c "SELECT 1;" &> /dev/null; then
        print_step "✓ Conexión exitosa a BD nueva"
    else
        print_error "No se pudo conectar a la BD nueva"
        exit 1
    fi
}

count_rows_old_db() {
    print_step "Contando registros en BD antigua..."
    psql "$OLD_DB_URL" -t -c "
        SELECT 'cv_lab_cvs: ' || COUNT(*) FROM cv_lab_cvs
        UNION ALL
        SELECT 'cv_lab_versions: ' || COUNT(*) FROM cv_lab_versions
        UNION ALL
        SELECT 'cv_lab_messages: ' || COUNT(*) FROM cv_lab_messages
        UNION ALL
        SELECT 'cv_lab_assets: ' || COUNT(*) FROM cv_lab_assets
        UNION ALL
        SELECT 'cv_lab_feedback: ' || COUNT(*) FROM cv_lab_feedback
        UNION ALL
        SELECT 'cv_lab_prompt_versions: ' || COUNT(*) FROM cv_lab_prompt_versions
        UNION ALL
        SELECT 'cv_lab_learned_patterns: ' || COUNT(*) FROM cv_lab_learned_patterns
        UNION ALL
        SELECT 'cv_lab_training_sessions: ' || COUNT(*) FROM cv_lab_training_sessions
        UNION ALL
        SELECT 'cv_lab_training_messages: ' || COUNT(*) FROM cv_lab_training_messages
        UNION ALL
        SELECT 'cv_lab_training_feedback: ' || COUNT(*) FROM cv_lab_training_feedback
        UNION ALL
        SELECT 'cv_lab_training_progress: ' || COUNT(*) FROM cv_lab_training_progress
        UNION ALL
        SELECT 'cv_lab_training_tests: ' || COUNT(*) FROM cv_lab_training_tests;
    "
}

export_table() {
    local table_name=$1
    local csv_file="${TMP_DIR}/${table_name}.csv"

    print_step "Exportando $table_name..."
    psql "$OLD_DB_URL" -c "\copy (SELECT * FROM $table_name ORDER BY created_at) TO '$csv_file' CSV HEADER" || {
        print_error "Error exportando $table_name"
        return 1
    }

    local row_count=$(wc -l < "$csv_file" | tr -d ' ')
    row_count=$((row_count - 1))  # Restar header
    print_step "✓ Exportados $row_count registros de $table_name"
}

import_table() {
    local table_name=$1
    local csv_file="${TMP_DIR}/${table_name}.csv"

    if [ ! -f "$csv_file" ]; then
        print_warning "Archivo $csv_file no existe, saltando..."
        return
    fi

    print_step "Importando $table_name..."
    psql "$NEW_DB_URL" -c "\copy $table_name FROM '$csv_file' CSV HEADER" || {
        print_error "Error importando $table_name"
        return 1
    }

    print_step "✓ $table_name importado"
}

verify_migration() {
    print_step "Verificando migración..."

    echo ""
    echo "=== Registros en BD NUEVA ==="
    psql "$NEW_DB_URL" -t -c "
        SELECT 'cv_lab_cvs: ' || COUNT(*) FROM cv_lab_cvs
        UNION ALL
        SELECT 'cv_lab_versions: ' || COUNT(*) FROM cv_lab_versions
        UNION ALL
        SELECT 'cv_lab_messages: ' || COUNT(*) FROM cv_lab_messages
        UNION ALL
        SELECT 'cv_lab_assets: ' || COUNT(*) FROM cv_lab_assets
        UNION ALL
        SELECT 'cv_lab_feedback: ' || COUNT(*) FROM cv_lab_feedback
        UNION ALL
        SELECT 'cv_lab_prompt_versions: ' || COUNT(*) FROM cv_lab_prompt_versions
        UNION ALL
        SELECT 'cv_lab_learned_patterns: ' || COUNT(*) FROM cv_lab_learned_patterns
        UNION ALL
        SELECT 'cv_lab_training_sessions: ' || COUNT(*) FROM cv_lab_training_sessions
        UNION ALL
        SELECT 'cv_lab_training_messages: ' || COUNT(*) FROM cv_lab_training_messages
        UNION ALL
        SELECT 'cv_lab_training_feedback: ' || COUNT(*) FROM cv_lab_training_feedback
        UNION ALL
        SELECT 'cv_lab_training_progress: ' || COUNT(*) FROM cv_lab_training_progress
        UNION ALL
        SELECT 'cv_lab_training_tests: ' || COUNT(*) FROM cv_lab_training_tests;
    "
    echo ""
}

cleanup() {
    print_step "Limpiando archivos temporales..."
    rm -rf "$TMP_DIR"
    print_step "✓ Limpieza completada"
}

# =============================================================================
# MAIN
# =============================================================================

main() {
    echo ""
    echo "========================================="
    echo "  MIGRACIÓN DE DATOS CV LAB"
    echo "========================================="
    echo ""

    # 1. Verificar prerequisitos
    check_prerequisites

    # 2. Crear directorio temporal
    create_temp_dir

    # 3. Probar conexiones
    test_connections

    # 4. Mostrar conteo inicial
    echo ""
    echo "=== Registros en BD ANTIGUA ==="
    count_rows_old_db
    echo ""

    # 5. Confirmar con el usuario
    read -p "¿Deseas continuar con la migración? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Migración cancelada por el usuario"
        exit 0
    fi

    # 6. Exportar tablas
    echo ""
    print_step "FASE 1: Exportando datos..."
    echo ""

    export_table "cv_lab_cvs"
    export_table "cv_lab_versions"
    export_table "cv_lab_messages"
    export_table "cv_lab_assets"
    export_table "cv_lab_feedback"
    export_table "cv_lab_prompt_versions"
    export_table "cv_lab_learned_patterns"
    export_table "cv_lab_training_sessions"
    export_table "cv_lab_training_messages"
    export_table "cv_lab_training_feedback"
    export_table "cv_lab_training_progress"
    export_table "cv_lab_training_tests"

    # 7. Importar tablas
    echo ""
    print_step "FASE 2: Importando datos..."
    echo ""

    import_table "cv_lab_cvs"
    import_table "cv_lab_versions"
    import_table "cv_lab_messages"
    import_table "cv_lab_assets"
    import_table "cv_lab_feedback"
    import_table "cv_lab_prompt_versions"
    import_table "cv_lab_learned_patterns"
    import_table "cv_lab_training_sessions"
    import_table "cv_lab_training_messages"
    import_table "cv_lab_training_feedback"
    import_table "cv_lab_training_progress"
    import_table "cv_lab_training_tests"

    # 8. Verificar migración
    verify_migration

    # 9. Limpiar
    cleanup

    echo ""
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}  MIGRACIÓN COMPLETADA EXITOSAMENTE${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    print_step "Próximos pasos:"
    echo "  1. Verifica que los datos estén correctos en la nueva BD"
    echo "  2. Prueba la aplicación lab-cv con la nueva BD"
    echo "  3. Una vez validado, actualiza el .env para usar solo la nueva BD"
    echo ""
}

# Ejecutar
main
