#!/bin/bash

# Script de Prueba de Efectividad de OCTAVIA
# Crea múltiples CVs y mide su rendimiento

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuración
API_URL="${API_URL:-http://localhost:3000}"
TOTAL_CVS="${TOTAL_CVS:-5}"
MIN_READINESS_SCORE="${MIN_READINESS_SCORE:-80}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test de Efectividad de OCTAVIA${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Configuración:${NC}"
echo "  - API URL: $API_URL"
echo "  - CVs a crear: $TOTAL_CVS"
echo "  - Readiness mínimo: $MIN_READINESS_SCORE"
echo ""

# Métricas globales
TOTAL_MESSAGES=0
TOTAL_TOKENS_IN=0
TOTAL_TOKENS_OUT=0
TOTAL_TIME=0
SUCCESSFUL_CVS=0
FAILED_CVS=0

# Arrays para resultados
declare -a READINESS_SCORES
declare -a TIMES

# Función para crear un CV y conversación completa
create_and_complete_cv() {
  local cv_number=$1
  local user_profile=$2

  echo -e "${BLUE}[CV #$cv_number] Iniciando...${NC}"

  START_TIME=$(date +%s)

  # 1. Crear sesión de training
  SESSION_RESPONSE=$(curl -s -X POST "$API_URL/api/cv-lab/training/init-progress" \
    -H "Content-Type: application/json" \
    -d '{"level": 1}')

  SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.sessionId // empty')

  if [ -z "$SESSION_ID" ]; then
    echo -e "${RED}[CV #$cv_number] Error: No se pudo crear sesión${NC}"
    ((FAILED_CVS++))
    return 1
  fi

  echo -e "${GREEN}[CV #$cv_number] Sesión creada: $SESSION_ID${NC}"

  # 2. Simular conversación natural completa
  local messages=(
    "Hola OCTAVIA, necesito ayuda para crear mi CV"
    "$user_profile"
    "Quiero que mi CV destaque mis logros cuantificables"
    "¿Cómo puedo mejorar la descripción de mi experiencia?"
    "Dame sugerencias para el resumen profesional"
    "¿Qué skills debo incluir?"
    "¿Cómo está quedando mi CV hasta ahora?"
  )

  local message_count=0
  local tokens_in=0
  local tokens_out=0

  for msg in "${messages[@]}"; do
    ((message_count++))

    echo -e "${YELLOW}[CV #$cv_number] Mensaje $message_count: ${msg:0:50}...${NC}"

    # Enviar mensaje
    RESPONSE=$(curl -s -X POST "$API_URL/api/cv-lab/training/chat" \
      -H "Content-Type: application/json" \
      -d "{\"sessionId\": \"$SESSION_ID\", \"message\": \"$msg\"}")

    # Extraer tokens
    MSG_TOKENS_IN=$(echo $RESPONSE | jq -r '.tokensIn // 0')
    MSG_TOKENS_OUT=$(echo $RESPONSE | jq -r '.tokensOut // 0')

    tokens_in=$((tokens_in + MSG_TOKENS_IN))
    tokens_out=$((tokens_out + MSG_TOKENS_OUT))

    # Pequeña pausa para simular conversación natural
    sleep 2
  done

  # 3. Obtener CV final y readiness score
  FINAL_CV=$(curl -s "$API_URL/api/cv-lab/training/sessions?sessionId=$SESSION_ID")
  READINESS=$(echo $FINAL_CV | jq -r '.readinessScore // 0')

  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))

  # Guardar métricas
  READINESS_SCORES+=($READINESS)
  TIMES+=($DURATION)
  TOTAL_MESSAGES=$((TOTAL_MESSAGES + message_count))
  TOTAL_TOKENS_IN=$((TOTAL_TOKENS_IN + tokens_in))
  TOTAL_TOKENS_OUT=$((TOTAL_TOKENS_OUT + tokens_out))
  TOTAL_TIME=$((TOTAL_TIME + DURATION))

  # Verificar si cumple el mínimo
  if [ "$READINESS" -ge "$MIN_READINESS_SCORE" ]; then
    ((SUCCESSFUL_CVS++))
    echo -e "${GREEN}[CV #$cv_number] ✓ Completado${NC}"
    echo -e "  - Readiness Score: ${GREEN}${READINESS}${NC}/100"
    echo -e "  - Mensajes: $message_count"
    echo -e "  - Tokens: ${tokens_in}in + ${tokens_out}out"
    echo -e "  - Tiempo: ${DURATION}s"
  else
    ((FAILED_CVS++))
    echo -e "${RED}[CV #$cv_number] ✗ No alcanzó el mínimo${NC}"
    echo -e "  - Readiness Score: ${RED}${READINESS}${NC}/100 (mínimo: $MIN_READINESS_SCORE)"
    echo -e "  - Mensajes: $message_count"
    echo -e "  - Tiempo: ${DURATION}s"
  fi

  echo ""
}

# Perfiles de usuario de prueba
USER_PROFILES=(
  "Soy desarrollador full-stack con 5 años de experiencia en React, Node.js y PostgreSQL. He trabajado en startups y empresas grandes. Busco un puesto senior."
  "Ingeniera de datos con experiencia en Python, Spark y AWS. He liderado proyectos de migración a la nube y construido pipelines de datos para empresas Fortune 500."
  "Product Manager con background técnico. 8 años creando productos SaaS desde cero hasta millones de usuarios. Experto en metodologías ágiles y data-driven decision making."
  "Diseñador UX/UI con 6 años de experiencia. Portfolio con apps móviles premiadas. Especialista en design systems y accesibilidad."
  "DevOps Engineer certificado en AWS y Kubernetes. Experiencia automatizando deployments y reduciendo costos de infraestructura en 40%."
)

# Ejecutar tests
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Ejecutando Tests${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

for i in $(seq 1 $TOTAL_CVS); do
  # Seleccionar perfil de usuario (circular)
  profile_index=$(( (i - 1) % ${#USER_PROFILES[@]} ))
  user_profile="${USER_PROFILES[$profile_index]}"

  create_and_complete_cv $i "$user_profile"
done

# Calcular estadísticas finales
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Resultados Finales${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Calcular promedios
AVG_READINESS=0
if [ ${#READINESS_SCORES[@]} -gt 0 ]; then
  SUM=0
  for score in "${READINESS_SCORES[@]}"; do
    SUM=$((SUM + score))
  done
  AVG_READINESS=$((SUM / ${#READINESS_SCORES[@]}))
fi

AVG_TIME=0
if [ ${#TIMES[@]} -gt 0 ]; then
  SUM=0
  for time in "${TIMES[@]}"; do
    SUM=$((SUM + time))
  done
  AVG_TIME=$((SUM / ${#TIMES[@]}))
fi

AVG_MESSAGES_PER_CV=$((TOTAL_MESSAGES / TOTAL_CVS))
SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($SUCCESSFUL_CVS / $TOTAL_CVS) * 100}")

# Mostrar resultados
echo -e "${GREEN}✓ CVs Exitosos:${NC} $SUCCESSFUL_CVS / $TOTAL_CVS (${SUCCESS_RATE}%)"
echo -e "${RED}✗ CVs Fallidos:${NC} $FAILED_CVS / $TOTAL_CVS"
echo ""
echo -e "${YELLOW}Métricas Promedio:${NC}"
echo "  - Readiness Score: $AVG_READINESS/100"
echo "  - Tiempo por CV: ${AVG_TIME}s"
echo "  - Mensajes por CV: $AVG_MESSAGES_PER_CV"
echo ""
echo -e "${YELLOW}Totales:${NC}"
echo "  - Mensajes totales: $TOTAL_MESSAGES"
echo "  - Tokens de entrada: $TOTAL_TOKENS_IN"
echo "  - Tokens de salida: $TOTAL_TOKENS_OUT"
echo "  - Tiempo total: ${TOTAL_TIME}s ($(awk "BEGIN {printf \"%.1f\", $TOTAL_TIME/60}")m)"
echo ""

# Calcular costos
COST_INPUT=$(awk "BEGIN {printf \"%.4f\", ($TOTAL_TOKENS_IN / 1000000) * 0.15}")
COST_OUTPUT=$(awk "BEGIN {printf \"%.4f\", ($TOTAL_TOKENS_OUT / 1000000) * 0.60}")
TOTAL_COST=$(awk "BEGIN {printf \"%.4f\", $COST_INPUT + $COST_OUTPUT}")
COST_PER_CV=$(awk "BEGIN {printf \"%.4f\", $TOTAL_COST / $TOTAL_CVS}")

echo -e "${YELLOW}Costos de IA:${NC}"
echo "  - Costo total: \$$TOTAL_COST"
echo "  - Costo por CV: \$$COST_PER_CV"
echo "  - Input cost: \$$COST_INPUT"
echo "  - Output cost: \$$COST_OUTPUT"
echo ""

# Conclusión
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Conclusión${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ "$SUCCESS_RATE" == "100.0" ]; then
  echo -e "${GREEN}✓ EXCELENTE: 100% de CVs alcanzaron el readiness mínimo${NC}"
elif (( $(echo "$SUCCESS_RATE >= 80" | bc -l) )); then
  echo -e "${GREEN}✓ BUENO: $SUCCESS_RATE% de CVs alcanzaron el readiness mínimo${NC}"
elif (( $(echo "$SUCCESS_RATE >= 60" | bc -l) )); then
  echo -e "${YELLOW}⚠ REGULAR: Solo $SUCCESS_RATE% de CVs alcanzaron el readiness mínimo${NC}"
  echo -e "${YELLOW}  Considera mejorar los prompts de OCTAVIA${NC}"
else
  echo -e "${RED}✗ CRÍTICO: Solo $SUCCESS_RATE% de CVs alcanzaron el readiness mínimo${NC}"
  echo -e "${RED}  Es necesario revisar y mejorar el sistema${NC}"
fi

echo ""

# Guardar resultados en JSON
RESULTS_FILE="test-results-$(date +%Y%m%d-%H%M%S).json"
cat > "$RESULTS_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "config": {
    "totalCvs": $TOTAL_CVS,
    "minReadinessScore": $MIN_READINESS_SCORE
  },
  "results": {
    "successfulCvs": $SUCCESSFUL_CVS,
    "failedCvs": $FAILED_CVS,
    "successRate": $SUCCESS_RATE
  },
  "metrics": {
    "avgReadinessScore": $AVG_READINESS,
    "avgTimePerCv": $AVG_TIME,
    "avgMessagesPerCv": $AVG_MESSAGES_PER_CV,
    "totalMessages": $TOTAL_MESSAGES,
    "totalTokensIn": $TOTAL_TOKENS_IN,
    "totalTokensOut": $TOTAL_TOKENS_OUT,
    "totalTime": $TOTAL_TIME
  },
  "costs": {
    "totalCost": $TOTAL_COST,
    "costPerCv": $COST_PER_CV,
    "inputCost": $COST_INPUT,
    "outputCost": $COST_OUTPUT
  },
  "readinessScores": [$(IFS=,; echo "${READINESS_SCORES[*]}")]
}
EOF

echo -e "${GREEN}Resultados guardados en: $RESULTS_FILE${NC}"
echo ""
