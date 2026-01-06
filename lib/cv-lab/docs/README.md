# CV Lab - Documentación

## Estructura

```
docs/
├── README.md                    # Este archivo
└── training/
    ├── TRAINING_REPORT.md       # Reporte completo del entrenamiento
    ├── profiles/                # Perfiles de prueba (9)
    │   ├── 01-raul-software-dev-panama.md
    │   ├── 02-elena-cloud-architect-panama.md
    │   ├── 03-carlos-data-scientist-mexico.md
    │   ├── 04-maria-ux-designer-spain.md
    │   ├── 05-gap-laboral-cuidador.md
    │   ├── 06-cambio-carrera-profesor-pm.md
    │   ├── 07-junior-recien-graduado.md
    │   ├── 08-senior-20-anos-experiencia.md
    │   └── 09-freelancer-solo-independiente.md
    └── jobs/                    # Job descriptions (10)
        ├── 01-senior-software-engineer-fintech.md
        ├── 02-data-scientist-ecommerce.md
        ├── 03-product-designer-saas.md
        ├── 04-devops-cloud-architect.md
        ├── 05-junior-frontend-developer.md
        ├── 06-fullstack-react-node-remoto.md
        ├── 07-marketing-digital-manager.md
        ├── 08-project-manager-agile.md
        ├── 09-ml-engineer-nlp.md
        └── 10-sales-engineer-saas.md
```

---

## Componentes del Sistema

### 1. Agente OCTAVIA

**Nombre completo:** Optimizadora de Currículums con Tecnología y Visión Avanzada

**Prompt activo:** v4.0-stable (6,235 caracteres)

**Características:**
- Regla crítica #0: Bulk processing inmediato
- 5 reglas absolutas (no inventar, métricas, STAR, ATS, una pregunta)
- Formato cv_update JSON
- Sistema Readiness Score 0-100

### 2. Sistema de Entrenamiento

**Archivo:** `lib/cv-lab/training-levels.ts`

| Nivel | Nombre | Descripción |
|-------|--------|-------------|
| 1-3 | Fundamentos | Saludo, datos personales, NO inventar |
| 4-6 | Calidad | Métricas, STAR, datos incompletos |
| 7-8 | Casos especiales | Gaps laborales, cambio carrera |
| 9-10 | Avanzado | ATS, usuarios expertos |
| 11-12 | Rendimiento | Velocidad, tools JSON |
| 13-15 | Profesional | Bulk, ATS avanzado, entrevistas |

---

## Perfiles de Entrenamiento

| # | Nombre | Categoría | Dificultad |
|---|--------|-----------|------------|
| 01 | Raúl Fernández | standard | medium |
| 02 | Elena Ramírez | standard | medium |
| 03 | Carlos Mendoza | standard | medium |
| 04 | María José García | standard | medium |
| 05 | Roberto Sánchez | gap_laboral | hard |
| 06 | Ana Patricia Ruiz | career_change | hard |
| 07 | Diego Torres | junior | easy |
| 08 | Fernando Martínez | senior | hard |
| 09 | Valentina Herrera | freelancer | medium |

---

## Jobs de Entrenamiento

| # | Título | Seniority | Industria |
|---|--------|-----------|-----------|
| 01 | Senior Software Engineer | senior | Fintech |
| 02 | Data Scientist | mid | E-commerce |
| 03 | Product Designer | senior | SaaS |
| 04 | DevOps/Cloud Architect | senior | Tech |
| 05 | Junior Frontend Developer | junior | Startup |
| 06 | Full Stack Developer | mid | Fintech |
| 07 | Marketing Digital Manager | mid | Marketing |
| 08 | Project Manager Agile | senior | Consultora |
| 09 | ML Engineer NLP | senior | AI |
| 10 | Sales Engineer | mid | SaaS |

---

## Escala de Matching CV-Job

| Score | Tipo | Acción del Agente |
|-------|------|-------------------|
| 90-100% | Match perfecto | Ajustes menores |
| 70-89% | Match fuerte | Agregar keywords faltantes |
| 50-69% | Match moderado | Reframing de experiencia |
| 30-49% | Match bajo | Sugerir upskilling |
| 0-29% | No match | Recomendar otros puestos |

---

## Base de Datos

### Tablas principales:
- `cv_lab_training_profiles` - Perfiles de prueba
- `cv_lab_training_jobs` - Job descriptions
- `cv_lab_training_matches` - Resultados de matching
- `cv_lab_prompt_versions` - Versiones del prompt

### Consultas útiles:
```sql
-- Ver perfiles
SELECT id, name, category, difficulty FROM cv_lab_training_profiles;

-- Ver jobs
SELECT id, title, seniority FROM cv_lab_training_jobs;

-- Ver prompt activo
SELECT version, is_active FROM cv_lab_prompt_versions WHERE is_active = true;
```

---

## Archivos de Código

| Archivo | Propósito |
|---------|-----------|
| `training-levels.ts` | Sistema de 15 niveles con escenarios |
| `ai-engine.ts` | Motor de IA (streamCvChat, extractCvUpdate) |
| `cv-schema.ts` | Schema JSON del CV |
| `readiness.ts` | Cálculo de readiness score |
| `pdf-generator.ts` | Generación de PDF |
| `linkedin-parser.ts` | Parser de LinkedIn |

---

## Estado del Proyecto

**Completado:**
- ✅ Sistema de 15 niveles
- ✅ 9 perfiles de prueba
- ✅ 10 job descriptions
- ✅ Prompt v4.0-stable
- ✅ Documentación

**Pendiente:**
- ⏳ 6 perfiles adicionales
- ⏳ 5 jobs no-tech
- ⏳ Niveles 16-18
- ⏳ Pruebas reales (10)
- ⏳ Auto-evaluación

---

*Última actualización: 2026-01-06*
