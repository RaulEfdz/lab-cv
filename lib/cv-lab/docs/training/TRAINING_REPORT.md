# CV Lab - Reporte de Entrenamiento del Agente OCTAVIA

**Fecha:** 2026-01-06
**Versión del Prompt:** v4.0-stable
**Estado:** En producción

---

## 1. Resumen Ejecutivo

El agente **OCTAVIA** (Optimizadora de Currículums con Tecnología y Visión Avanzada) ha sido entrenado mediante un sistema de **15 niveles progresivos** que cubren desde interacciones básicas hasta optimización ATS avanzada y preparación para entrevistas.

### Métricas del Sistema

| Métrica | Valor |
|---------|-------|
| Niveles de entrenamiento | 15 |
| Escenarios totales | 45+ |
| Perfiles de prueba | 9 |
| Trabajos de prueba | 10 |
| Versiones del prompt | 4 |
| Tamaño del prompt activo | 6,235 caracteres |

---

## 2. Arquitectura del Entrenamiento

### 2.1 Sistema de Niveles Progresivos

```
┌─────────────────────────────────────────────────────────────────┐
│  NIVEL 1-3: FUNDAMENTOS                                         │
│  ├── Saludo y presentación                                      │
│  ├── Procesamiento de datos personales                          │
│  └── ⭐ NO INVENTAR DATOS (crítico)                             │
├─────────────────────────────────────────────────────────────────┤
│  NIVEL 4-6: CALIDAD DE CONTENIDO                                │
│  ├── Métricas cuantificables (%, $, números)                    │
│  ├── Formato STAR para logros                                   │
│  └── Manejo de datos incompletos                                │
├─────────────────────────────────────────────────────────────────┤
│  NIVEL 7-8: CASOS ESPECIALES                                    │
│  ├── Gaps laborales (empatía + alternativas)                    │
│  └── Cambio de carrera (habilidades transferibles)              │
├─────────────────────────────────────────────────────────────────┤
│  NIVEL 9-10: USUARIOS AVANZADOS                                 │
│  ├── Optimización ATS básica                                    │
│  └── Casos complejos (20+ años exp, C-Level, confidencial)      │
├─────────────────────────────────────────────────────────────────┤
│  NIVEL 11-12: RENDIMIENTO Y HERRAMIENTAS                        │
│  ├── Velocidad y eficiencia (<3s respuesta)                     │
│  └── Uso correcto de cv_update JSON                             │
├─────────────────────────────────────────────────────────────────┤
│  NIVEL 13-15: AVANZADO                                          │
│  ├── Procesamiento bulk (LinkedIn, CV existente)                │
│  ├── ATS avanzado (keywords, gap analysis)                      │
│  └── Titulares, resúmenes y prep. entrevista                    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de Entrenamiento

```
Usuario/Escenario → Agente OCTAVIA → Evaluación
       │                  │              │
       ▼                  ▼              ▼
   Input con         Respuesta      Verificar:
   contexto          + cv_update    - Comportamiento esperado
                                    - Criterios de fallo
                                    - Tags de calidad
                                    - Métricas (latencia, tokens)
```

---

## 3. Perfiles de Entrenamiento

### 3.1 Matriz de Perfiles por Categoría

| # | Nombre | Categoría | Dificultad | Rol |
|---|--------|-----------|------------|-----|
| 01 | Raúl Fernández | standard | medium | Software Developer |
| 02 | Elena Ramírez | standard | medium | Cloud Architect |
| 03 | Carlos Mendoza | standard | medium | Data Scientist |
| 04 | María José García | standard | medium | UX Designer |
| 05 | Roberto Sánchez | gap_laboral | hard | Financial Analyst |
| 06 | Ana Patricia Ruiz | career_change | hard | Teacher → PM |
| 07 | Diego Torres | junior | easy | Junior Developer |
| 08 | Fernando Martínez | senior | hard | CTO |
| 09 | Valentina Herrera | freelancer | medium | Graphic Designer |

### 3.2 Descripción de Categorías

**Standard:** Perfiles típicos con experiencia lineal y progresiva.

**Gap Laboral:** Usuarios con períodos sin empleo. Entrenamiento de:
- Empatía y tono apropiado
- Identificación de actividades durante el gap
- Habilidades desarrolladas (cuidado familiar, proyectos personales)
- Opciones de incluir o no en CV

**Career Change:** Usuarios cambiando de industria. Entrenamiento de:
- Identificación de habilidades transferibles
- Reframing de experiencia previa
- Conexión de logros con nueva industria
- Sugerencia de certificaciones relevantes

**Junior:** Recién graduados con poca experiencia. Entrenamiento de:
- Valorar proyectos académicos y personales
- Destacar potencial sobre experiencia
- Incluir internships, voluntariado, cursos

**Senior/Executive:** Profesionales con 15-20+ años. Entrenamiento de:
- Priorización (últimos 10-15 años relevantes)
- Enfoque en impacto estratégico
- Métricas de alto nivel (P&L, revenue, equipos grandes)
- Executive summary fuerte

**Freelancer:** Trabajadores independientes. Entrenamiento de:
- Presentar proyectos como experiencia laboral
- Destacar diversidad de clientes
- Mostrar habilidades de autogestión

---

## 4. Trabajos de Prueba (Job Descriptions)

### 4.1 Matriz de Trabajos

| # | Título | Seniority | Tipo | Keywords ATS |
|---|--------|-----------|------|--------------|
| 01 | Senior Software Engineer - Fintech | senior | full-time | Python, Node.js, AWS, microservices |
| 02 | Data Scientist - E-commerce | mid | full-time | Python, ML, SQL, tableau |
| 03 | Senior Product Designer - SaaS | senior | full-time | Figma, UX, prototyping |
| 04 | DevOps Engineer / Cloud Architect | senior | full-time | Kubernetes, Terraform, CI/CD |
| 05 | Junior Frontend Developer | junior | full-time | React, JavaScript, CSS |
| 06 | Full Stack Developer (React + Node.js) | mid | full-time | React, Node.js, TypeScript, PostgreSQL |
| 07 | DevOps Engineer | senior | full-time | Kubernetes, Docker, Terraform, Prometheus |
| 08 | Machine Learning Engineer | senior | full-time | Python, PyTorch, TensorFlow, MLOps |
| 09 | QA Automation Engineer | mid | full-time | Selenium, Cypress, Playwright |
| 10 | Technical Project Manager | senior | full-time | Scrum, Kanban, Stakeholders |

### 4.2 Distribución por Seniority

```
Senior:  6 trabajos (60%)
Mid:     3 trabajos (30%)
Junior:  1 trabajo  (10%)
```

---

## 5. Escala de Matching CV-Job

### 5.1 Sistema de Scoring

El agente debe manejar toda la **escala de grises** del matching, no solo "match" o "no match":

```
SCORE 90-100%  │  MATCH PERFECTO
───────────────┼─────────────────────────────────────────────────
               │  • Todas las keywords presentes
               │  • Experiencia en industria exacta
               │  • Seniority coincide
               │  • Métricas demuestran impacto relevante
               │
               │  Respuesta: "Tu perfil es altamente compatible.
               │  Sugiero ajustar X bullet para destacar Y."
───────────────┼─────────────────────────────────────────────────
SCORE 70-89%   │  MATCH FUERTE
───────────────┼─────────────────────────────────────────────────
               │  • 80%+ keywords presentes
               │  • Experiencia relacionada
               │  • 1-2 gaps menores
               │
               │  Respuesta: "Buen match. Faltan estas keywords:
               │  [lista]. ¿Tienes experiencia con alguna?"
───────────────┼─────────────────────────────────────────────────
SCORE 50-69%   │  MATCH MODERADO
───────────────┼─────────────────────────────────────────────────
               │  • 50-80% keywords presentes
               │  • Industria diferente pero habilidades transferibles
               │  • Puede requerir reframing significativo
               │
               │  Respuesta: "Match moderado. Tu experiencia en X
               │  puede traducirse a Y así: [sugerencias]"
───────────────┼─────────────────────────────────────────────────
SCORE 30-49%   │  MATCH BAJO (con potencial)
───────────────┼─────────────────────────────────────────────────
               │  • <50% keywords
               │  • Seniority diferente
               │  • Requiere upskilling
               │
               │  Respuesta: "Gap significativo. Para mejorar:
               │  1. Certificación en X
               │  2. Proyecto personal con Y
               │  3. Destacar habilidad transferible Z"
───────────────┼─────────────────────────────────────────────────
SCORE 0-29%    │  NO MATCH (pero orientación)
───────────────┼─────────────────────────────────────────────────
               │  • Industria completamente diferente
               │  • Skills no relacionados
               │  • Seniority muy distante
               │
               │  Respuesta: "Este puesto no es el mejor fit
               │  actualmente. Basándome en tu perfil, te
               │  recomendaría buscar puestos de [tipo] o
               │  considerar [ruta de transición]."
```

### 5.2 Factores de Evaluación

```
┌────────────────────────────────────────────────────────────────┐
│ FACTOR                      │ PESO │ DESCRIPCIÓN              │
├────────────────────────────────────────────────────────────────┤
│ Keywords técnicos           │ 30%  │ Match de hard skills     │
│ Experiencia en industria    │ 20%  │ Fintech, e-commerce, etc │
│ Seniority level             │ 20%  │ Junior/Mid/Senior        │
│ Métricas cuantificables     │ 15%  │ Logros medibles          │
│ Soft skills relevantes      │ 10%  │ Liderazgo, comunicación  │
│ Ubicación/Modalidad         │ 5%   │ Remote, híbrido, onsite  │
└────────────────────────────────────────────────────────────────┘
```

### 5.3 Ejemplos de Matching por Escenario

#### Escenario A: Match Perfecto (90%+)
```
Perfil: Raúl Fernández (Software Developer, Python, Node.js, IA)
Job:    Senior Software Engineer - Fintech

Match Score: 92%
Keywords Match: Python ✓, Node.js ✓, AWS ✓, microservices ✓
Gap: Ninguno significativo

Respuesta OCTAVIA:
"Excelente match para este puesto. Tu experiencia en IA y
automatización se alinea perfectamente con fintech. Sugiero
resaltar tu proyecto de OCR para procesos bancarios."
```

#### Escenario B: Match Moderado con Reframing (55%)
```
Perfil: Ana Patricia Ruiz (Profesora → Product Manager)
Job:    Technical Project Manager

Match Score: 55%
Keywords Match: Scrum parcial, comunicación ✓, liderazgo ✓
Gap: Sin certificación PM, sin experiencia tech directa

Respuesta OCTAVIA:
"Match moderado. Tus habilidades docentes traducen así:
- Gestión de aula (30 estudiantes) → Gestión de stakeholders
- Planificación curricular → Roadmap de proyecto
- Evaluación continua → Métricas de seguimiento

Recomiendo: 1) Certificación Scrum Master, 2) Destacar tu
proyecto de digitalización escolar."
```

#### Escenario C: Match Bajo con Orientación (25%)
```
Perfil: Valentina Herrera (Diseñadora Gráfica Freelance)
Job:    Machine Learning Engineer

Match Score: 25%
Keywords Match: Python ✗, PyTorch ✗, ML ✗
Gap: Industria completamente diferente

Respuesta OCTAVIA:
"Este puesto requiere skills muy diferentes a tu perfil actual.
Basándome en tu experiencia, te recomendaría:
- Senior Product Designer (85% match estimado)
- UX Designer en AI Products (puente hacia tech)
- Creative Technologist (combina diseño + código)

Si te interesa ML, considera bootcamps como [X] que tienen
tracks para diseñadores."
```

#### Escenario D: Gap Laboral + Job (Variable)
```
Perfil: Roberto Sánchez (2 años gap por cuidado familiar)
Job:    Financial Analyst

Match Score: 70% (ajustado)
Keywords Match: Finance ✓, análisis ✓, Excel ✓
Gap: 2 años sin empleo formal

Respuesta OCTAVIA:
"Tu experiencia pre-gap es relevante. Para el período 2022-2024:
- ¿Manejaste finanzas familiares/inversiones personales?
- ¿Tomaste algún curso o certificación?
- ¿Hiciste consultoría informal?

Podemos reformular el gap positivamente si tienes actividades
que demuestren continuidad en finanzas."
```

---

## 6. Técnicas de Entrenamiento Aplicadas

### 6.1 Prompt Engineering

| Técnica | Aplicación |
|---------|------------|
| **Role Prompting** | "Eres OCTAVIA, experta en RH con 15+ años" |
| **Reglas Explícitas** | 5 reglas absolutas con formato ⛔ |
| **Ejemplos Positivos/Negativos** | ✅ CORRECTO vs ❌ INCORRECTO |
| **Formato Estructurado** | JSON schema para cv_update |
| **Anti-patrones** | Lista explícita de "NUNCA HACER" |
| **Scoring System** | Readiness Score 0-100 con desglose |

### 6.2 Scenario-Based Learning

Cada nivel tiene escenarios con:
- `userMessage`: Input de prueba
- `expectedBehavior`: Comportamientos correctos (array)
- `failCriteria`: Comportamientos incorrectos (array)
- `tags`: Categorización (helpful, accurate, good_tone, etc.)
- `difficulty`: easy/medium/hard

### 6.3 Progressive Difficulty

```
Nivel 1-3:   Escenarios "easy" → Score requerido: 80%
Nivel 4-6:   Escenarios "medium" → Score requerido: 80-85%
Nivel 7-10:  Escenarios "medium-hard" → Score requerido: 80-90%
Nivel 11-15: Escenarios "hard" + métricas → Score requerido: 85-90%
```

### 6.4 Métricas de Rendimiento (Nivel 11+)

```typescript
metrics: {
  latencyMs: number,      // <3000ms ideal
  estimatedTokens: number, // <150 para respuestas simples
  wordCount: number,       // Concisión
  charactersCount: number
}

toolInfo: {
  toolUsed: 'cv_update' | 'text_response',
  schemasUsed: string[],   // ['header', 'experience', ...]
  jsonValid: boolean,
  jsonError: string | null
}
```

### 6.5 Iteración del Prompt

| Versión | Cambios Principales |
|---------|---------------------|
| v1.0 | Prompt básico (658 chars) |
| v2.0 | + Reglas explícitas, formato JSON (4,966 chars) |
| v3.0 | + Ejemplos, anti-patrones, scoring (6,235 chars) |
| v4.0-stable | + Regla crítica #0 (bulk processing), refinamientos |

---

## 7. Flujo de Interacción

### 7.1 Flujo Principal

```
┌──────────────────────────────────────────────────────────────┐
│                    INICIO DE SESIÓN                          │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │  Usuario envía mensaje      │
              └─────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│ BULK DATA             │       │ CONVERSACIONAL        │
│ (LinkedIn, CV texto)  │       │ (Paso a paso)         │
└───────────────────────┘       └───────────────────────┘
            │                               │
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│ 1. Extraer TODO       │       │ 1. Procesar dato      │
│ 2. Generar cv_update  │       │ 2. cv_update parcial  │
│ 3. Calcular score     │       │ 3. Siguiente pregunta │
│ 4. Preguntar métricas │       └───────────────────────┘
└───────────────────────┘                   │
            │                               │
            └───────────────┬───────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │  ¿Tiene Job Description?    │
              └─────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│ SÍ: Modo Matching     │       │ NO: Modo Construcción │
│                       │       │                       │
│ • Extraer keywords    │       │ • Continuar llenando  │
│ • Calcular match %    │       │ • Pedir métricas      │
│ • Identificar gaps    │       │ • Optimizar bullets   │
│ • Sugerir mejoras     │       │ • Llegar a 80+ score  │
└───────────────────────┘       └───────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │  Readiness Score ≥80?       │
              └─────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│ SÍ: CV Listo          │       │ NO: Continuar mejoras │
│                       │       │                       │
│ • Ofrecer exportar    │       │ • Indicar qué falta   │
│ • Prep. entrevista    │       │ • Pedir datos         │
│ • Match con más jobs  │       │ • Loop hasta 80+      │
└───────────────────────┘       └───────────────────────┘
```

### 7.2 Flujo de Matching CV ↔ Job

```
┌─────────────────────────────────────────────────────────────┐
│                     JOB DESCRIPTION                         │
│  "Senior Software Engineer - Python, AWS, Kubernetes..."   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │  EXTRACCIÓN DE KEYWORDS     │
              │                             │
              │  Hard: Python, AWS, K8s     │
              │  Soft: liderazgo, comunicación│
              │  Industry: fintech          │
              │  Seniority: senior          │
              └─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     CV DEL USUARIO                          │
│  Skills: Python ✓, Node.js ✓, AWS ✓, Docker ✓              │
│  Industry: banking ✓                                        │
│  Seniority: senior ✓                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │  CÁLCULO DE MATCH           │
              │                             │
              │  Keywords: 75% (3/4 hard)   │
              │  Industry: 100%             │
              │  Seniority: 100%            │
              │  Métricas: 80%              │
              │  ─────────────────────      │
              │  TOTAL: 85%                 │
              └─────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │  RESPUESTA PERSONALIZADA    │
              │                             │
              │  "Match fuerte (85%).       │
              │   Falta: Kubernetes.        │
              │   ¿Tienes experiencia con   │
              │   orquestación de           │
              │   contenedores?"            │
              └─────────────────────────────┘
```

---

## 8. Casos de Prueba Críticos

### 8.1 Caso: NO Inventar Datos (Nivel 3)

```
Input:  "Trabajé en una empresa de tecnología"
Output CORRECTO:  "¿Cuál es el nombre de la empresa?"
Output INCORRECTO: "Trabajaste en Google/Microsoft/etc..."

Verificación: El agente NUNCA debe:
- Inventar nombres de empresas
- Asumir fechas
- Asumir cargos específicos
```

### 8.2 Caso: Bulk Processing (Nivel 13)

```
Input: [Perfil completo de LinkedIn pegado]
Output CORRECTO:
1. Procesa TODA la información
2. Genera cv_update con todos los datos
3. DESPUÉS pregunta por métricas faltantes

Output INCORRECTO:
1. Ignora la información
2. Pregunta "¿Cuál es tu nombre?"
```

### 8.3 Caso: Gap Laboral con Empatía (Nivel 7)

```
Input: "Estuve 2 años sin trabajar cuidando a mi padre enfermo"
Output CORRECTO:
- Muestra empatía breve
- Pregunta por habilidades desarrolladas
- Ofrece no incluir si prefiere
- NO juzga

Output INCORRECTO:
- "Eso es un gap negativo..."
- Ignora el contexto emocional
```

### 8.4 Caso: Matching con Reframing (Nivel 8 + 14)

```
Input:  Profesor → Quiere ser Product Manager
Job:    Technical Project Manager

Output CORRECTO:
- Identifica transferibles: gestión de aula → stakeholders
- Sugiere certificaciones: Scrum, PMP
- Propone reformular experiencia docente
- Da match score realista (50-60%)

Output INCORRECTO:
- "No es posible el cambio"
- No conecta experiencias
```

---

## 9. Métricas de Éxito

### 9.1 KPIs del Sistema

| Métrica | Target | Medición |
|---------|--------|----------|
| Latencia respuesta | <3s | Nivel 11 |
| Precisión datos | 100% | Nivel 3 |
| JSON válido | >95% | Nivel 12 |
| Usuario satisfecho | >4.5/5 | Feedback |
| CV completado | >70% | Readiness 80+ |

### 9.2 Distribución de Scores Esperada

```
Para usuarios que completan el flujo:

Score Final   │  % Usuarios
──────────────┼─────────────
90-100        │  20%
80-89         │  35%
70-79         │  25%
60-69         │  15%
<60           │  5% (abandonan)
```

---

## 10. Próximos Pasos

### 10.1 Mejoras Pendientes

- [ ] Agregar más perfiles de prueba (target: 15)
- [ ] Implementar sistema de feedback automático
- [ ] Añadir nivel 16: Múltiples idiomas
- [ ] Integrar con LinkedIn API para import real
- [ ] A/B testing de diferentes prompts

### 10.2 Monitoreo Continuo

- Revisar logs de conversaciones semanalmente
- Identificar patrones de fallo
- Actualizar prompt basado en errores comunes
- Expandir escenarios de entrenamiento

---

## 11. Base de Datos

### 11.1 Tablas Utilizadas

```sql
cv_lab_training_profiles   -- 9 perfiles
cv_lab_training_jobs       -- 10 trabajos
cv_lab_training_matches    -- Matches calculados
cv_lab_training_sessions   -- Sesiones de prueba
cv_lab_training_messages   -- Historial de conversación
cv_lab_prompt_versions     -- Versiones del prompt
```

### 11.2 Consultas Útiles

```sql
-- Ver todos los perfiles
SELECT id, name, category, difficulty, role
FROM cv_lab_training_profiles ORDER BY created_at;

-- Ver todos los trabajos
SELECT id, title, seniority, keywords_ats
FROM cv_lab_training_jobs ORDER BY created_at;

-- Ver prompt activo
SELECT version, LEFT(system_prompt, 500)
FROM cv_lab_prompt_versions WHERE is_active = true;
```

---

**Autor:** Sistema de Entrenamiento CV Lab
**Última actualización:** 2026-01-06
