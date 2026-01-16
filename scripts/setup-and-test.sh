#!/bin/bash

# ============================================
# Script de Setup y Testing Multi-Usuario
# CV Lab - Verificación completa de seguridad
# ============================================

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         CV Lab - Setup y Testing Multi-Usuario            ║"
echo "║                 Verificación de Seguridad                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Debes ejecutar este script desde la raíz del proyecto${NC}"
    exit 1
fi

# Verificar que existen las variables de entorno
echo -e "${BLUE}🔍 Verificando variables de entorno...${NC}"

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SECRET_KEY" ]; then
    echo -e "${YELLOW}⚠️  Variables de entorno no detectadas${NC}"
    echo "Verificando archivo .env.local..."

    if [ ! -f ".env.local" ]; then
        echo -e "${RED}❌ Error: No se encontró .env.local${NC}"
        echo "Crea un archivo .env.local con:"
        echo "  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co"
        echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx..."
        echo "  SUPABASE_SECRET_KEY=eyJxxx..."
        exit 1
    fi

    # Cargar variables de entorno
    export $(cat .env.local | xargs)
    echo -e "${GREEN}✅ Variables cargadas desde .env.local${NC}"
else
    echo -e "${GREEN}✅ Variables de entorno detectadas${NC}"
fi

# Verificar que existe tsx
echo -e "\n${BLUE}🔍 Verificando dependencias...${NC}"

if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Error: npx no está instalado${NC}"
    exit 1
fi

# Instalar tsx si no existe
if ! npx tsx --version &> /dev/null 2>&1; then
    echo -e "${YELLOW}📦 Instalando tsx...${NC}"
    npm install -D tsx
    echo -e "${GREEN}✅ tsx instalado${NC}"
else
    echo -e "${GREEN}✅ tsx ya está instalado${NC}"
fi

# Mostrar instrucciones para el script SQL
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PASO 1: Ejecutar Script SQL en Supabase Dashboard        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC} Antes de continuar, debes ejecutar el script SQL"
echo "en el Supabase Dashboard para aplicar las restricciones de admin."
echo ""
echo "Pasos:"
echo "  1. Ve a Supabase Dashboard → SQL Editor"
echo "  2. Abre el archivo: ${GREEN}scripts/restrict-admin-access.sql${NC}"
echo "  3. Copia TODO el contenido"
echo "  4. Pega en el SQL Editor de Supabase"
echo "  5. Click en 'Run'"
echo ""
read -p "$(echo -e ${YELLOW}¿Ya ejecutaste el script SQL? [s/N]:${NC} )" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⏸️  Proceso pausado.${NC}"
    echo "Por favor, ejecuta el script SQL y vuelve a correr este script."
    exit 0
fi

# Ejecutar tests automáticos
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PASO 2: Ejecutando Tests Automáticos                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}🧪 Iniciando tests multi-usuario...${NC}\n"

# Ejecutar el script de testing
if npx tsx scripts/test-multi-user.ts; then
    echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ TODOS LOS TESTS PASARON                                ║${NC}"
    echo -e "${GREEN}║  Sistema seguro y listo para producción                   ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}\n"

    echo -e "${BLUE}📋 Resumen:${NC}"
    echo "  ✅ Solo raulefdz@gmail.com es admin"
    echo "  ✅ Usuarios regulares solo ven sus CVs"
    echo "  ✅ No hay fuga de información"
    echo "  ✅ RLS policies funcionan correctamente"
    echo "  ✅ Operaciones no autorizadas bloqueadas"

    echo -e "\n${GREEN}🎉 Sistema completamente funcional y seguro${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "  1. Prueba manualmente en el navegador"
    echo "  2. Login como usuario regular: usuario1@test.com / TestPassword123!"
    echo "  3. Login como admin: raulefdz@gmail.com / [tu contraseña]"
    echo "  4. Verifica que cada uno ve solo lo que debe ver"
    echo ""
    exit 0
else
    echo -e "\n${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ ALGUNOS TESTS FALLARON                                 ║${NC}"
    echo -e "${RED}║  Revisa los errores arriba                                ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}\n"

    echo -e "${YELLOW}⚠️  Posibles causas:${NC}"
    echo "  - El script SQL no se ejecutó correctamente"
    echo "  - Las políticas RLS no están aplicadas"
    echo "  - Variables de entorno incorrectas"
    echo ""
    echo "Soluciones:"
    echo "  1. Ve a Supabase Dashboard → SQL Editor"
    echo "  2. Re-ejecuta el script: scripts/restrict-admin-access.sql"
    echo "  3. Verifica que RLS está habilitado en las tablas"
    echo "  4. Vuelve a ejecutar este script"
    echo ""
    exit 1
fi
