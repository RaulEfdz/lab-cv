#!/bin/bash

# Script para ejecutar la migración de restricción de admin
# Este script facilita el proceso de ejecución en Supabase Dashboard

echo "=============================================="
echo "  MIGRACIÓN: Restricción de Admin"
echo "=============================================="
echo ""

SQL_FILE="scripts/restrict-admin-access.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "❌ Error: No se encontró el archivo $SQL_FILE"
  exit 1
fi

echo "✅ Archivo de migración encontrado: $SQL_FILE"
echo ""
echo "📋 Contenido de la migración:"
echo "---------------------------------------------"
cat "$SQL_FILE"
echo ""
echo "---------------------------------------------"
echo ""

# Intentar copiar al clipboard (macOS)
if command -v pbcopy &> /dev/null; then
  cat "$SQL_FILE" | pbcopy
  echo "✅ SQL copiado al clipboard!"
  echo ""
fi

echo "🔧 PASOS PARA EJECUTAR:"
echo ""
echo "1. Abrir Supabase Dashboard:"
echo "   👉 https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/sql"
echo ""
echo "2. Hacer click en 'New Query'"
echo ""
if command -v pbcopy &> /dev/null; then
  echo "3. Pegar el contenido (ya está en tu clipboard)"
else
  echo "3. Copiar el SQL de arriba y pegarlo"
fi
echo ""
echo "4. Hacer click en 'Run' para ejecutar"
echo ""
echo "5. Verificar que se ejecutó correctamente"
echo ""
echo "=============================================="
echo ""

# Preguntar si quiere abrir el navegador
read -p "¿Quieres abrir Supabase Dashboard en el navegador? (s/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[SsYy]$ ]]; then
  if command -v open &> /dev/null; then
    open "https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/sql"
    echo "✅ Dashboard abierto en el navegador"
  else
    echo "⚠️  No se pudo abrir automáticamente. Abre manualmente:"
    echo "https://supabase.com/dashboard/project/ygvzkfotrdqyehiqljle/sql"
  fi
fi

echo ""
echo "📝 NOTA: Esta migración hará lo siguiente:"
echo "  - Revocar rol admin de todos excepto raulefdz@gmail.com"
echo "  - Asegurar que raulefdz@gmail.com sea admin"
echo "  - Crear trigger para nuevos usuarios"
echo "  - Prevenir cambios de rol no autorizados"
echo ""
echo "✅ Listo para ejecutar!"
