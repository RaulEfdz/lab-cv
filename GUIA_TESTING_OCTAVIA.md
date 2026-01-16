# 🤖 Guía de Testing de OCTAVIA

## API Pública para Testing

OCTAVIA tiene endpoints públicos diseñados específicamente para pruebas y entrenamiento.

---

## 📍 Endpoints Disponibles

### 1. Crear Sesión de Training
```bash
POST /api/cv-lab/training/init-progress
Content-Type: application/json

{
  "level": 1  # Nivel de entrenamiento (1-12)
}
```

**Respuesta**:
```json
{
  "sessionId": "uuid-here",
  "level": 1,
  "progress": 0
}
```

---

### 2. Chatear con OCTAVIA
```bash
POST /api/cv-lab/training/chat
Content-Type: application/json

{
  "sessionId": "uuid-here",
  "message": "Hola OCTAVIA, necesito ayuda con mi CV",
  "cvState": {}  # Opcional: estado actual del CV
}
```

**Respuesta**:
```json
{
  "response": "¡Hola! Encantada de ayudarte...",
  "sessionId": "uuid-here",
  "readinessScore": 25,
  "cvUpdate": {
    "action": "update_section",
    "section": "header",
    "data": {...}
  },
  "tokensIn": 150,
  "tokensOut": 200
}
```

---

### 3. Obtener Estado de Sesión
```bash
GET /api/cv-lab/training/sessions?sessionId=uuid-here
```

**Respuesta**:
```json
{
  "id": "uuid-here",
  "name": "Training...",
  "readinessScore": 75,
  "cvState": {
    "header": {...},
    "experience": [...],
    ...
  },
  "messages": [...]
}
```

---

### 4. Dar Feedback
```bash
POST /api/cv-lab/training/feedback
Content-Type: application/json

{
  "sessionId": "uuid-here",
  "messageId": "uuid-here",
  "rating": 5,
  "feedback": "Muy útil",
  "tags": ["helpful", "accurate"]
}
```

---

## 🚀 Scripts de Prueba

### Prueba Rápida (1 CV)
```bash
./scripts/quick-test-octavia.sh
```

**Qué hace**:
- Crea una sesión
- Envía 2 mensajes de prueba
- Muestra el readiness score
- Te da el session ID para continuar

**Duración**: ~10 segundos

---

### Prueba de Efectividad (Múltiples CVs)
```bash
# Configuración por defecto (5 CVs)
./scripts/test-octavia-effectiveness.sh

# Configuración personalizada
TOTAL_CVS=10 MIN_READINESS_SCORE=80 ./scripts/test-octavia-effectiveness.sh
```

**Qué hace**:
- Crea N CVs completos
- Simula conversaciones naturales
- Mide readiness score
- Calcula métricas de rendimiento
- Calcula costos de IA
- Genera reporte JSON

**Duración**: ~2-3 min por CV

**Resultados incluyen**:
- ✓ CVs exitosos vs fallidos
- Readiness score promedio
- Tiempo promedio por CV
- Mensajes promedio por CV
- Tokens totales usados
- Costo total y por CV
- Tasa de éxito (%)

**Archivo de salida**: `test-results-YYYYMMDD-HHMMSS.json`

---

## 💡 Ejemplos de Uso Manual

### Ejemplo 1: Conversación Simple

```bash
# 1. Crear sesión
curl -X POST http://localhost:3000/api/cv-lab/training/init-progress \
  -H "Content-Type: application/json" \
  -d '{"level": 1}'

# Guardar sessionId de la respuesta

# 2. Mensaje inicial
curl -X POST http://localhost:3000/api/cv-lab/training/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "TU-SESSION-ID",
    "message": "Hola OCTAVIA, soy Pedro Martínez, desarrollador con 5 años de experiencia"
  }'

# 3. Agregar experiencia
curl -X POST http://localhost:3000/api/cv-lab/training/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "TU-SESSION-ID",
    "message": "Trabajé en Google como Senior Developer. Lideré un equipo de 5 personas y aumentamos la velocidad de la app en 40%"
  }'

# 4. Pedir sugerencias
curl -X POST http://localhost:3000/api/cv-lab/training/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "TU-SESSION-ID",
    "message": "¿Cómo puedo mejorar mi readiness score?"
  }'

# 5. Ver estado actual
curl http://localhost:3000/api/cv-lab/training/sessions?sessionId=TU-SESSION-ID
```

---

### Ejemplo 2: Test de Personalidad

**Objetivo**: Probar cómo OCTAVIA maneja diferentes tonos de usuario

```bash
# Usuario formal
curl -X POST http://localhost:3000/api/cv-lab/training/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION-1",
    "message": "Estimada OCTAVIA, requiero asistencia para elaborar mi curriculum vitae profesional"
  }'

# Usuario casual
curl -X POST http://localhost:3000/api/cv-lab/training/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION-2",
    "message": "Oye OCTAVIA, ayúdame con mi CV porfa, no tengo idea de cómo empezar"
  }'

# Usuario técnico
curl -X POST http://localhost:3000/api/cv-lab/training/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION-3",
    "message": "OCTAVIA, necesito un CV optimizado para ATS con métricas cuantificables en formato STAR"
  }'
```

**Verificar**: ¿OCTAVIA adapta su tono? ¿Es natural?

---

### Ejemplo 3: Test de Corrección de Errores

```bash
# Enviar datos con errores
curl -X POST http://localhost:3000/api/cv-lab/training/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION-ID",
    "message": "soy desaroyador fullstack con esperiencia en reac y nod js trabaje en goglee 5 añs"
  }'
```

**Verificar**: ¿OCTAVIA corrige ortografía? ¿Pide clarificación?

---

## 📊 Métricas a Evaluar

### 1. Readiness Score
- **Meta**: 80+
- **Bueno**: 70-79
- **Regular**: 60-69
- **Malo**: <60

### 2. Tasa de Éxito
- **Excelente**: 100%
- **Bueno**: 80-99%
- **Regular**: 60-79%
- **Crítico**: <60%

### 3. Costo por CV
- **Óptimo**: <$0.02
- **Aceptable**: $0.02-$0.05
- **Alto**: >$0.05

### 4. Tiempo por CV
- **Rápido**: <60s
- **Normal**: 60-120s
- **Lento**: >120s

### 5. Mensajes por CV
- **Eficiente**: <10
- **Normal**: 10-15
- **Verboso**: >15

---

## 🎯 Casos de Prueba Recomendados

### Test 1: CV Completo desde Cero
**Objetivo**: Verificar que OCTAVIA puede crear un CV completo

**Pasos**:
1. Crear sesión
2. Proporcionar información básica
3. Agregar experiencia (2-3 puestos)
4. Agregar educación
5. Agregar skills
6. Pedir revisión

**Criterio de éxito**: Readiness ≥ 80

---

### Test 2: CV con LinkedIn Copy-Paste
**Objetivo**: Procesar texto de LinkedIn directamente

**Pasos**:
1. Crear sesión
2. Pegar texto completo de perfil de LinkedIn
3. Pedir que extraiga y organice

**Criterio de éxito**: Extrae correctamente nombre, empresas, roles

---

### Test 3: Mejora de CV Existente
**Objetivo**: Optimizar un CV de readiness bajo

**Pasos**:
1. Crear sesión con CV base (readiness 40-50)
2. Pedir sugerencias específicas
3. Aplicar cambios
4. Medir mejora

**Criterio de éxito**: Readiness aumenta ≥ 20 puntos

---

### Test 4: Conversación Natural
**Objetivo**: Probar naturalidad de la conversación

**Pasos**:
1. Hacer preguntas fuera de contexto
2. Cambiar de tema abruptamente
3. Pedir aclaraciones
4. Hacer preguntas repetidas

**Criterio de éxito**: OCTAVIA mantiene contexto y es coherente

---

### Test 5: Manejo de Errores
**Objetivo**: Probar robustez ante datos incorrectos

**Pasos**:
1. Enviar datos con typos
2. Enviar fechas en formato incorrecto
3. Enviar información incompleta
4. Enviar emojis y caracteres especiales

**Criterio de éxito**: OCTAVIA solicita clarificación o corrige

---

## 🔧 Variables de Entorno

```bash
# API URL (default: http://localhost:3000)
export API_URL="https://tu-deploy.vercel.app"

# Cantidad de CVs a crear en test de efectividad
export TOTAL_CVS=10

# Readiness score mínimo para considerar exitoso
export MIN_READINESS_SCORE=80
```

---

## 📈 Interpretación de Resultados

### Reporte de Ejemplo
```json
{
  "timestamp": "2026-01-16T03:00:00Z",
  "results": {
    "successfulCvs": 9,
    "failedCvs": 1,
    "successRate": 90.0
  },
  "metrics": {
    "avgReadinessScore": 82,
    "avgTimePerCv": 95,
    "avgMessagesPerCv": 12,
    "totalTokensIn": 45000,
    "totalTokensOut": 18000
  },
  "costs": {
    "totalCost": 0.0175,
    "costPerCv": 0.00175
  }
}
```

**Interpretación**:
- ✅ 90% de éxito: **Bueno**
- ✅ Readiness promedio 82: **Excelente**
- ✅ 95s por CV: **Normal**
- ✅ 12 mensajes: **Eficiente**
- ✅ $0.00175 por CV: **Óptimo**

**Conclusión**: OCTAVIA funciona muy bien

---

## 🚨 Problemas Comunes

### Error: "sessionId not found"
**Causa**: La sesión expiró o no existe
**Solución**: Crear nueva sesión con `/init-progress`

### Error: "message is required"
**Causa**: Mensaje vacío o no es string
**Solución**: Verificar formato JSON

### Readiness Score bajo (<60)
**Causa**: Información incompleta o prompts subóptimos
**Solución**:
1. Revisar prompts del sistema
2. Agregar más detalles en mensajes
3. Usar formato STAR para experiencia

### Costos altos (>$0.05/CV)
**Causa**: Muchos tokens de salida
**Solución**:
1. Optimizar prompts
2. Reducir contexto enviado
3. Usar modelos más eficientes

---

## 💡 Tips para Mejores Resultados

1. **Sé específico**: Más detalles = mejor CV
2. **Usa números**: "Aumenté ventas en 40%" mejor que "Aumenté ventas"
3. **Formato STAR**: Situación, Tarea, Acción, Resultado
4. **Conversación natural**: OCTAVIA aprende del tono
5. **Itera**: Pide feedback y ajusta

---

## 📝 Próximos Pasos

1. Ejecutar tests automatizados
2. Revisar resultados
3. Identificar áreas de mejora
4. Ajustar prompts si es necesario
5. Re-testear

**Ciclo de mejora continua** 🔄

---

## 🎉 Conclusión

Con estos scripts puedes:
- ✅ Probar OCTAVIA fácilmente
- ✅ Medir su efectividad
- ✅ Identificar mejoras
- ✅ Calcular costos reales
- ✅ Garantizar calidad

**¡Empieza a probar ahora!**

```bash
./scripts/quick-test-octavia.sh
```
