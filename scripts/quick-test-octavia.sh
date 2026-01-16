#!/bin/bash

# Script de Prueba Rápida de OCTAVIA
# Crea un CV simple y muestra el resultado

API_URL="${API_URL:-http://localhost:3000}"

echo "🤖 Probando OCTAVIA..."
echo ""

# 1. Crear sesión
echo "1. Creando sesión..."
SESSION=$(curl -s -X POST "$API_URL/api/cv-lab/training/init-progress" \
  -H "Content-Type: application/json" \
  -d '{"level": 1}')

SESSION_ID=$(echo $SESSION | jq -r '.sessionId')
echo "   Sesión ID: $SESSION_ID"
echo ""

# 2. Enviar mensaje 1
echo "2. Mensaje 1: Hola OCTAVIA..."
RESPONSE1=$(curl -s -X POST "$API_URL/api/cv-lab/training/chat" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"message\": \"Hola OCTAVIA, necesito ayuda para crear mi CV\"}")

echo "   OCTAVIA: $(echo $RESPONSE1 | jq -r '.response' | head -c 100)..."
echo ""

# 3. Enviar mensaje 2 con datos
echo "3. Mensaje 2: Mis datos profesionales..."
RESPONSE2=$(curl -s -X POST "$API_URL/api/cv-lab/training/chat" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"message\": \"Soy desarrollador full-stack con 5 años de experiencia en React, Node.js y PostgreSQL. Email: test@example.com, teléfono: +507 6677-7777\"}")

echo "   OCTAVIA: $(echo $RESPONSE2 | jq -r '.response' | head -c 100)..."
READINESS=$(echo $RESPONSE2 | jq -r '.readinessScore // 0')
echo "   Readiness Score: $READINESS"
echo ""

# 4. Ver CV actual
echo "4. Estado del CV:"
CV=$(curl -s "$API_URL/api/cv-lab/training/sessions?sessionId=$SESSION_ID")
echo $CV | jq '{readinessScore, header: .cvState.header}'
echo ""

echo "✅ Prueba completada"
echo "   Session ID: $SESSION_ID"
echo "   Usa este session ID para continuar la conversación"
echo ""
echo "Ejemplo:"
echo "curl -X POST $API_URL/api/cv-lab/training/chat \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"sessionId\": \"$SESSION_ID\", \"message\": \"Dame sugerencias para mejorar\"}'"
