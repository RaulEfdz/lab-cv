// Training Levels System for CV Lab AI
// 15 levels from simple to complex users
// Updated: 2026-01-05 - Added levels 13-15 (Bulk Processing, ATS Advanced, Interview Prep)

export interface TrainingLevel {
  level: number
  name: string
  description: string
  scenarios: TrainingScenario[]
  requiredScore: number // Score needed to pass (out of 100)
  skills: string[] // Skills learned at this level
}

export interface TrainingScenario {
  id: string
  userMessage: string
  expectedBehavior: string[]
  failCriteria: string[]
  tags: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  // Level 11+ specific: Performance metrics
  maxLatencyMs?: number // Maximum acceptable response time
  maxTokens?: number // Maximum response tokens (conciseness)
  // Level 12 specific: Tool usage
  expectedTool?: 'cv_update' | 'text_response' | 'document_extract'
  expectedSchema?: string // Expected JSON schema for cv_update
}

export interface TrainingProgress {
  currentLevel: number
  completedLevels: number[]
  totalScore: number
  skillsLearned: string[]
  patternsStrengthened: string[]
  lastTrainingDate: string
}

export const TRAINING_LEVELS: TrainingLevel[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // NIVEL 1: Usuario Básico - Solo saludo
  // ══════════════════════════════════════════════════════════════════════════
  {
    level: 1,
    name: "Saludo Básico",
    description: "El AI debe responder de forma concisa y hacer UNA pregunta",
    requiredScore: 80,
    skills: ["respuesta_concisa", "una_pregunta_a_la_vez"],
    scenarios: [
      {
        id: "l1-s1",
        userMessage: "Hola",
        expectedBehavior: [
          "Respuesta corta (menos de 100 palabras)",
          "Se presenta como ARIA",
          "Hace UNA sola pregunta",
          "Pregunta por nombre o rol objetivo"
        ],
        failCriteria: [
          "Respuesta muy larga (más de 200 palabras)",
          "Múltiples preguntas",
          "No se presenta"
        ],
        tags: ["helpful", "good_tone"],
        difficulty: "easy"
      },
      {
        id: "l1-s2",
        userMessage: "Quiero crear mi CV",
        expectedBehavior: [
          "Confirma el objetivo",
          "Pregunta por nombre completo",
          "Tono amigable pero profesional"
        ],
        failCriteria: [
          "Lista 10 preguntas a la vez",
          "Respuesta genérica sin dirección"
        ],
        tags: ["helpful", "good_format"],
        difficulty: "easy"
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NIVEL 2: Información Personal
  // ══════════════════════════════════════════════════════════════════════════
  {
    level: 2,
    name: "Datos Personales",
    description: "El AI debe procesar datos de contacto correctamente",
    requiredScore: 80,
    skills: ["procesar_contacto", "formato_correcto"],
    scenarios: [
      {
        id: "l2-s1",
        userMessage: "Mi nombre es Carlos Rodríguez",
        expectedBehavior: [
          "Confirma el nombre",
          "Pregunta por el siguiente dato (email o título)",
          "NO inventa otros datos"
        ],
        failCriteria: [
          "Inventa apellido o datos adicionales",
          "No confirma el nombre"
        ],
        tags: ["accurate", "good_format"],
        difficulty: "easy"
      },
      {
        id: "l2-s2",
        userMessage: "carlos@email.com, +1 555-1234, Miami FL",
        expectedBehavior: [
          "Procesa los 3 datos correctamente",
          "Devuelve cv_update con formato JSON",
          "Pregunta por el headline/título profesional"
        ],
        failCriteria: [
          "Mezcla o confunde los datos",
          "No usa formato cv_update"
        ],
        tags: ["good_format", "accurate"],
        difficulty: "easy"
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NIVEL 3: NO Inventar Datos (CRÍTICO)
  // ══════════════════════════════════════════════════════════════════════════
  {
    level: 3,
    name: "No Inventar Datos",
    description: "El AI NUNCA debe inventar información que el usuario no proporcionó",
    requiredScore: 90, // Alto porque es crítico
    skills: ["no_inventar", "preguntar_antes_de_asumir"],
    scenarios: [
      {
        id: "l3-s1",
        userMessage: "Trabajé en una empresa de tecnología",
        expectedBehavior: [
          "Pregunta: ¿Cuál es el nombre de la empresa?",
          "Pregunta: ¿En qué fechas trabajaste?",
          "NO inventa nombre de empresa",
          "NO inventa cargo o fechas"
        ],
        failCriteria: [
          "Inventa nombre de empresa",
          "Asume fechas",
          "Asume cargo"
        ],
        tags: ["accurate", "helpful"],
        difficulty: "medium"
      },
      {
        id: "l3-s2",
        userMessage: "Fui desarrollador",
        expectedBehavior: [
          "Pregunta: ¿En qué empresa?",
          "Pregunta: ¿Qué tipo de desarrollador? (Frontend, Backend, Full Stack)",
          "NO inventa empresa ni fechas"
        ],
        failCriteria: [
          "Dice 'Fuiste desarrollador en X empresa...'",
          "Inventa tecnologías específicas"
        ],
        tags: ["accurate"],
        difficulty: "medium"
      },
      {
        id: "l3-s3",
        userMessage: "Mejoré las ventas en mi trabajo",
        expectedBehavior: [
          "Pregunta: ¿En qué porcentaje mejoraron?",
          "Pregunta: ¿Cuánto dinero adicional generó?",
          "NO inventa números"
        ],
        failCriteria: [
          "Dice 'Mejoraste las ventas en 30%...'",
          "Inventa cualquier métrica"
        ],
        tags: ["accurate", "good_metrics"],
        difficulty: "hard"
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NIVEL 4: Pedir Métricas Cuantificables
  // ══════════════════════════════════════════════════════════════════════════
  {
    level: 4,
    name: "Métricas Cuantificables",
    description: "El AI SIEMPRE debe pedir %, $, números para logros",
    requiredScore: 85,
    skills: ["pedir_metricas", "formato_star"],
    scenarios: [
      {
        id: "l4-s1",
        userMessage: "Aumenté la eficiencia del equipo",
        expectedBehavior: [
          "Pregunta: ¿En qué porcentaje aumentó?",
          "Pregunta: ¿Cómo se medía la eficiencia?",
          "Da ejemplo de cómo podría quedar el bullet"
        ],
        failCriteria: [
          "Acepta 'aumenté la eficiencia' sin métricas",
          "No pregunta por números"
        ],
        tags: ["good_metrics", "helpful"],
        difficulty: "medium"
      },
      {
        id: "l4-s2",
        userMessage: "Lideré un equipo de desarrolladores",
        expectedBehavior: [
          "Pregunta: ¿Cuántos desarrolladores?",
          "Pregunta: ¿Qué proyectos entregaron?",
          "Pregunta: ¿Cuál fue el resultado medible?"
        ],
        failCriteria: [
          "No pregunta por el tamaño del equipo",
          "No pregunta por resultados"
        ],
        tags: ["good_metrics"],
        difficulty: "medium"
      },
      {
        id: "l4-s3",
        userMessage: "Reduje costos en la empresa",
        expectedBehavior: [
          "Pregunta: ¿Cuánto $ se ahorró?",
          "Pregunta: ¿En qué período?",
          "Pregunta: ¿Cómo lo lograste?"
        ],
        failCriteria: [
          "Acepta sin preguntar monto",
          "No pide período de tiempo"
        ],
        tags: ["good_metrics", "helpful"],
        difficulty: "medium"
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NIVEL 5: Formato STAR para Logros
  // ══════════════════════════════════════════════════════════════════════════
  {
    level: 5,
    name: "Formato STAR",
    description: "El AI debe guiar al usuario a dar logros en formato Situación-Tarea-Acción-Resultado",
    requiredScore: 80,
    skills: ["formato_star", "bullets_profesionales"],
    scenarios: [
      {
        id: "l5-s1",
        userMessage: "Implementé un sistema nuevo",
        expectedBehavior: [
          "Pregunta por la Situación (¿qué problema había?)",
          "Pregunta por la Tarea (¿qué te pidieron hacer?)",
          "Pregunta por la Acción (¿qué hiciste específicamente?)",
          "Pregunta por el Resultado (¿cuál fue el impacto medible?)"
        ],
        failCriteria: [
          "No guía hacia formato STAR",
          "Acepta respuesta vaga"
        ],
        tags: ["helpful", "good_format"],
        difficulty: "medium"
      },
      {
        id: "l5-s2",
        userMessage: "Situación: El sistema era lento. Tarea: Optimizarlo. Acción: Refactoricé el código. Resultado: Mejoró la velocidad",
        expectedBehavior: [
          "Pide métricas en el Resultado: ¿Cuánto mejoró? ¿De X a Y?",
          "Ofrece redactar el bullet con verbos de acción",
          "Ejemplo: 'Optimicé sistema legacy, reduciendo tiempo de carga de 10s a 2s (80%)'"
        ],
        failCriteria: [
          "Acepta 'mejoró la velocidad' sin números",
          "No ofrece redactar el bullet"
        ],
        tags: ["good_metrics", "good_format"],
        difficulty: "hard"
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NIVEL 6: Manejo de Respuestas Incompletas
  // ══════════════════════════════════════════════════════════════════════════
  {
    level: 6,
    name: "Datos Incompletos",
    description: "El AI debe manejar respuestas vagas o incompletas sin inventar",
    requiredScore: 85,
    skills: ["manejar_vaguedad", "pedir_clarificacion"],
    scenarios: [
      {
        id: "l6-s1",
        userMessage: "Trabajé en varias empresas",
        expectedBehavior: [
          "Pide que liste las empresas una por una",
          "Empieza con la más reciente",
          "NO inventa nombres"
        ],
        failCriteria: [
          "Lista empresas inventadas",
          "Asume industria o rol"
        ],
        tags: ["accurate", "helpful"],
        difficulty: "medium"
      },
      {
        id: "l6-s2",
        userMessage: "No recuerdo las fechas exactas",
        expectedBehavior: [
          "Ofrece usar aproximaciones (ej: 'aproximadamente 2020')",
          "Pregunta: ¿Recuerdas el año al menos?",
          "Ofrece usar rangos (ej: '2019-2021')"
        ],
        failCriteria: [
          "Inventa fechas",
          "Se frustra con el usuario"
        ],
        tags: ["helpful", "good_tone"],
        difficulty: "medium"
      },
      {
        id: "l6-s3",
        userMessage: "No tengo números exactos de mis logros",
        expectedBehavior: [
          "Pide estimaciones: ¿Aproximadamente cuánto?",
          "Ofrece reformular sin números específicos",
          "Sugiere contactar ex-colegas para obtener datos"
        ],
        failCriteria: [
          "Inventa métricas",
          "Acepta logros sin ningún intento de cuantificar"
        ],
        tags: ["good_metrics", "helpful"],
        difficulty: "hard"
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NIVEL 7: Usuario con Gaps Laborales
  // ══════════════════════════════════════════════════════════════════════════
  {
    level: 7,
    name: "Gaps Laborales",
    description: "El AI debe manejar periodos sin empleo de forma profesional",
    requiredScore: 80,
    skills: ["manejar_gaps", "empatia", "alternativas"],
    scenarios: [
      {
        id: "l7-s1",
        userMessage: "Estuve 2 años sin trabajar",
        expectedBehavior: [
          "Pregunta con empatía: ¿Qué actividades realizaste en ese período?",
          "Ofrece alternativas: estudios, proyectos personales, voluntariado, cuidado familiar",
          "NO juzga ni critica"
        ],
        failCriteria: [
          "Hace comentarios negativos sobre el gap",
          "Inventa actividades"
        ],
        tags: ["good_tone", "helpful"],
        difficulty: "medium"
      },
      {
        id: "l7-s2",
        userMessage: "Cuidé a un familiar enfermo por 1 año",
        expectedBehavior: [
          "Muestra empatía breve",
          "Pregunta si desarrolló habilidades durante ese tiempo",
          "Ofrece no incluir en CV si prefiere"
        ],
        failCriteria: [
          "Insiste en incluirlo cuando el usuario no quiere",
          "Es insensible"
        ],
        tags: ["good_tone", "helpful"],
        difficulty: "medium"
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NIVEL 8: Cambio de Carrera
  // ══════════════════════════════════════════════════════════════════════════
  {
    level: 8,
    name: "Cambio de Carrera",
    description: "El AI debe ayudar a usuarios que cambian de industria",
    requiredScore: 80,
    skills: ["habilidades_transferibles", "reframing"],
    scenarios: [
      {
        id: "l8-s1",
        userMessage: "Era profesor y quiero ser Product Manager",
        expectedBehavior: [
          "Identifica habilidades transferibles: comunicación, gestión, planificación",
          "Sugiere cómo reformular experiencia docente",
          "Pregunta por proyectos o cursos en la nueva área"
        ],
        failCriteria: [
          "Dice que no es posible el cambio",
          "No conecta las experiencias"
        ],
        tags: ["helpful", "good_tone"],
        difficulty: "hard"
      },
      {
        id: "l8-s2",
        userMessage: "No tengo experiencia en tecnología pero quiero entrar al sector",
        expectedBehavior: [
          "Pregunta por proyectos personales, cursos, bootcamps",
          "Resalta soft skills valiosas",
          "Sugiere certificaciones relevantes"
        ],
        failCriteria: [
          "Desanima al usuario",
          "No ofrece alternativas"
        ],
        tags: ["helpful", "good_tone"],
        difficulty: "hard"
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NIVEL 9: Optimización ATS
  // ══════════════════════════════════════════════════════════════════════════
  {
    level: 9,
    name: "Optimización ATS",
    description: "El AI debe optimizar CVs para sistemas de tracking de aplicantes",
    requiredScore: 85,
    skills: ["keywords_ats", "formato_scaneable"],
    scenarios: [
      {
        id: "l9-s1",
        userMessage: "Quiero aplicar a este puesto: [descripción de Data Analyst con requisitos]",
        expectedBehavior: [
          "Extrae keywords de la descripción",
          "Sugiere incluir esas keywords en el CV",
          "Mapea experiencia del usuario a los requisitos"
        ],
        failCriteria: [
          "Ignora los requisitos del puesto",
          "No sugiere keywords"
        ],
        tags: ["helpful", "good_format"],
        difficulty: "hard"
      },
      {
        id: "l9-s2",
        userMessage: "¿Cómo hago para pasar los filtros automáticos?",
        expectedBehavior: [
          "Explica qué es ATS brevemente",
          "Sugiere usar keywords exactas del puesto",
          "Recomienda formato simple sin tablas ni gráficos"
        ],
        failCriteria: [
          "No explica ATS",
          "Da consejos contraproducentes"
        ],
        tags: ["helpful", "accurate"],
        difficulty: "medium"
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NIVEL 10: Usuario Experto / Casos Complejos
  // ══════════════════════════════════════════════════════════════════════════
  {
    level: 10,
    name: "Usuario Experto",
    description: "El AI debe manejar casos complejos y usuarios sofisticados",
    requiredScore: 90,
    skills: ["casos_complejos", "criterio_profesional", "adaptabilidad"],
    scenarios: [
      {
        id: "l10-s1",
        userMessage: "Tengo 20 años de experiencia en 8 empresas. ¿Cómo lo resumo?",
        expectedBehavior: [
          "Sugiere enfocarse en los últimos 10-15 años",
          "Propone agrupar roles similares",
          "Recomienda destacar 3-4 experiencias más relevantes"
        ],
        failCriteria: [
          "Intenta incluir todo",
          "No prioriza"
        ],
        tags: ["helpful", "good_format"],
        difficulty: "hard"
      },
      {
        id: "l10-s2",
        userMessage: "Soy C-Level (CEO/CTO/CFO). ¿Cómo estructuro mi CV?",
        expectedBehavior: [
          "Sugiere executive summary fuerte",
          "Enfoque en impacto estratégico y P&L",
          "Métricas de alto nivel: revenue, crecimiento, equipos grandes"
        ],
        failCriteria: [
          "Trata como CV junior",
          "No adapta el tono"
        ],
        tags: ["helpful", "good_tone"],
        difficulty: "hard"
      },
      {
        id: "l10-s3",
        userMessage: "Tengo trabajo confidencial que no puedo detallar (gobierno, seguridad)",
        expectedBehavior: [
          "Respeta la confidencialidad",
          "Sugiere describir en términos generales",
          "Ofrece usar 'Empresa confidencial del sector X'"
        ],
        failCriteria: [
          "Insiste en detalles",
          "No ofrece alternativas"
        ],
        tags: ["accurate", "good_tone"],
        difficulty: "hard"
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NIVEL 11: Velocidad y Eficiencia
  // ══════════════════════════════════════════════════════════════════════════
  {
    level: 11,
    name: "Velocidad y Eficiencia",
    description: "El AI debe responder rápido y de forma concisa sin perder calidad",
    requiredScore: 85,
    skills: ["respuesta_rapida", "concision", "eficiencia"],
    scenarios: [
      {
        id: "l11-s1",
        userMessage: "Hola, quiero hacer mi CV",
        expectedBehavior: [
          "Respuesta en menos de 3 segundos",
          "Menos de 50 palabras",
          "Una sola pregunta clara"
        ],
        failCriteria: [
          "Respuesta lenta (>5 segundos)",
          "Respuesta muy larga (>100 palabras)",
          "Múltiples preguntas"
        ],
        tags: ["fast_response", "concise"],
        difficulty: "medium",
        maxLatencyMs: 3000,
        maxTokens: 100
      },
      {
        id: "l11-s2",
        userMessage: "Soy desarrollador senior con 8 años de experiencia",
        expectedBehavior: [
          "Respuesta rápida (<3s)",
          "Confirma el dato brevemente",
          "Pregunta siguiente dato sin rodeos"
        ],
        failCriteria: [
          "Explica demasiado",
          "Hace múltiples preguntas",
          "Respuesta > 80 palabras"
        ],
        tags: ["fast_response", "concise"],
        difficulty: "medium",
        maxLatencyMs: 3000,
        maxTokens: 120
      },
      {
        id: "l11-s3",
        userMessage: "Mi email es juan@email.com, vivo en Madrid, +34 666 123 456",
        expectedBehavior: [
          "Procesa los 3 datos en una sola respuesta",
          "Confirma brevemente",
          "Pasa al siguiente paso inmediatamente"
        ],
        failCriteria: [
          "Pide confirmar cada dato por separado",
          "Respuesta lenta",
          "No avanza al siguiente paso"
        ],
        tags: ["fast_response", "efficient"],
        difficulty: "hard",
        maxLatencyMs: 4000,
        maxTokens: 150
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NIVEL 12: Uso Correcto de Tools (cv_update JSON)
  // ══════════════════════════════════════════════════════════════════════════
  {
    level: 12,
    name: "Uso de Tools",
    description: "El AI debe usar el formato cv_update JSON correctamente cuando actualiza el CV",
    requiredScore: 90,
    skills: ["uso_tools", "json_schema", "cv_update", "decision_tool"],
    scenarios: [
      {
        id: "l12-s1",
        userMessage: "Mi nombre es Carlos García, soy Frontend Developer",
        expectedBehavior: [
          "Responde con bloque ```cv_update o JSON válido",
          "Incluye header.fullName = 'Carlos García'",
          "Incluye header.headline = 'Frontend Developer'",
          "Incluye readinessScore"
        ],
        failCriteria: [
          "Solo responde en texto sin JSON",
          "JSON mal formado",
          "Falta algún campo requerido"
        ],
        tags: ["tool_usage", "json_valid"],
        difficulty: "medium",
        expectedTool: "cv_update",
        expectedSchema: "header"
      },
      {
        id: "l12-s2",
        userMessage: "¿Qué secciones debería incluir en mi CV?",
        expectedBehavior: [
          "Responde en TEXTO, NO en JSON",
          "Explica las secciones principales",
          "No intenta actualizar el CV"
        ],
        failCriteria: [
          "Responde con JSON innecesario",
          "Intenta actualizar el CV sin datos",
          "No responde la pregunta"
        ],
        tags: ["tool_decision", "helpful"],
        difficulty: "medium",
        expectedTool: "text_response"
      },
      {
        id: "l12-s3",
        userMessage: "Trabajé en Google de 2020 a 2023 como Senior Software Engineer. Lideré un equipo de 5 personas y aumentamos la eficiencia del sistema en 40%.",
        expectedBehavior: [
          "Genera cv_update con experience array",
          "company: 'Google'",
          "role: 'Senior Software Engineer'",
          "startDate: '2020', endDate: '2023'",
          "bullets incluyen el logro con métrica 40%"
        ],
        failCriteria: [
          "No genera JSON",
          "Falta algún campo de experience",
          "No incluye la métrica en bullets"
        ],
        tags: ["tool_usage", "json_valid", "accurate"],
        difficulty: "hard",
        expectedTool: "cv_update",
        expectedSchema: "experience"
      },
      {
        id: "l12-s4",
        userMessage: "Agrega estas skills: React, TypeScript, Node.js, y también soy bueno comunicando y trabajando en equipo",
        expectedBehavior: [
          "Genera cv_update con skills object",
          "skills.hard contiene: React, TypeScript, Node.js",
          "skills.soft contiene: comunicación, trabajo en equipo",
          "Separa correctamente hard vs soft skills"
        ],
        failCriteria: [
          "Mezcla hard y soft skills",
          "No genera JSON",
          "Falta alguna skill mencionada"
        ],
        tags: ["tool_usage", "json_valid"],
        difficulty: "hard",
        expectedTool: "cv_update",
        expectedSchema: "skills"
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NIVEL 13: Procesamiento Bulk de Datos (LinkedIn, CV existente)
  // ══════════════════════════════════════════════════════════════════════════
  {
    level: 13,
    name: "Procesamiento Bulk",
    description: "El AI debe procesar grandes cantidades de información de LinkedIn o CVs existentes inmediatamente, sin ignorar datos",
    requiredScore: 90,
    skills: ["bulk_processing", "linkedin_parsing", "data_extraction", "immediate_action"],
    scenarios: [
      {
        id: "l13-s1",
        userMessage: "Raul Fernandez\nSoftware Developer | AI & Process Optimization\nraulefdz@gmail.com\nPanama\n\nExperiencia:\nAnalista programador IA - Hypernova Labs - jun 2024 - actualidad\nWEB MASTER - IEEE - ene 2024 - dic 2024\nLider TI - COOPERATIVA RL - feb 2024 - jun 2024",
        expectedBehavior: [
          "Procesa TODOS los datos inmediatamente",
          "Genera cv_update con header completo",
          "Genera cv_update con TODAS las experiencias",
          "NO pregunta '¿Cuál es tu puesto objetivo?' ignorando la info",
          "Solo pregunta por métricas faltantes DESPUÉS de procesar"
        ],
        failCriteria: [
          "Ignora la información proporcionada",
          "Solo hace preguntas sin procesar datos",
          "Genera cv_update vacío o incompleto",
          "Pide información que ya está en el mensaje"
        ],
        tags: ["bulk_processing", "accurate", "immediate_action"],
        difficulty: "hard",
        expectedTool: "cv_update",
        expectedSchema: "header,experience"
      },
      {
        id: "l13-s2",
        userMessage: "Aquí está mi perfil de LinkedIn completo con 5 experiencias, educación, skills y certificaciones [texto largo simulando LinkedIn]",
        expectedBehavior: [
          "Extrae nombre, email, ubicación, links",
          "Extrae TODAS las experiencias laborales",
          "Extrae educación",
          "Extrae skills técnicos mencionados",
          "Genera JSON completo con todos los datos"
        ],
        failCriteria: [
          "Solo extrae parte de la información",
          "Ignora experiencias",
          "No genera cv_update"
        ],
        tags: ["bulk_processing", "linkedin_parsing"],
        difficulty: "hard",
        expectedTool: "cv_update"
      },
      {
        id: "l13-s3",
        userMessage: "Tengo un CV en texto: [nombre, 3 trabajos, 2 títulos universitarios, 10 skills]. Procésalo.",
        expectedBehavior: [
          "Procesa todo en una sola respuesta",
          "Genera cv_update completo",
          "Calcula readinessScore apropiado",
          "Identifica qué falta (métricas)"
        ],
        failCriteria: [
          "Pide información uno por uno",
          "Ignora secciones completas",
          "No genera JSON"
        ],
        tags: ["bulk_processing", "efficient"],
        difficulty: "hard",
        expectedTool: "cv_update"
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NIVEL 14: Optimización ATS Avanzada
  // ══════════════════════════════════════════════════════════════════════════
  {
    level: 14,
    name: "ATS Avanzado",
    description: "El AI debe extraer keywords de job descriptions, identificar gaps, y optimizar bullets para ATS",
    requiredScore: 85,
    skills: ["ats_keywords", "ats_optimization", "keyword_extraction", "gap_analysis"],
    scenarios: [
      {
        id: "l14-s1",
        userMessage: "Optimiza mi CV para esta posición:\nJOB: Senior Software Engineer\nRequisitos: Python, Node.js, AWS, Docker, Kubernetes, CI/CD, Agile\n\nMI CV: [datos del candidato con skills parciales]",
        expectedBehavior: [
          "Extrae keywords del job description",
          "Identifica keywords que FALTAN en el CV",
          "Sugiere cómo agregar keywords faltantes",
          "Genera cv_update con keywords array"
        ],
        failCriteria: [
          "Ignora el job description",
          "No identifica gaps de keywords",
          "No sugiere optimizaciones"
        ],
        tags: ["ats_keywords", "gap_analysis"],
        difficulty: "hard",
        expectedTool: "cv_update"
      },
      {
        id: "l14-s2",
        userMessage: "Este bullet está muy genérico: 'Mejoré procesos usando tecnología'. Optimízalo para ATS con estas keywords: Machine Learning, Python, AWS, CI/CD. El contexto real: desarrollé un sistema ML que automatiza reportes, reduciendo tiempo de 4h a 15min.",
        expectedBehavior: [
          "Transforma bullet genérico en específico",
          "Incluye TODAS las keywords mencionadas",
          "Incluye métricas cuantificables",
          "Usa verbos de acción fuertes",
          "Formato STAR implícito"
        ],
        failCriteria: [
          "Bullet sigue siendo genérico",
          "Faltan keywords solicitadas",
          "No incluye métricas",
          "Verbos débiles"
        ],
        tags: ["ats_optimization", "good_metrics"],
        difficulty: "hard"
      },
      {
        id: "l14-s3",
        userMessage: "Revisa mi CV completo para ATS y dime qué keywords faltan para puesto de Full Stack Developer Fintech. Keywords del job: React, Node.js, TypeScript, PostgreSQL, AWS, microservices, REST API, GraphQL, fintech, payments, PCI-DSS",
        expectedBehavior: [
          "Analiza el CV completo",
          "Lista keywords presentes",
          "Lista keywords FALTANTES",
          "Sugiere cómo incorporar las faltantes",
          "Da score de compatibilidad ATS"
        ],
        failCriteria: [
          "No identifica keywords faltantes",
          "Análisis incompleto",
          "No da recomendaciones accionables"
        ],
        tags: ["ats_review", "keyword_analysis"],
        difficulty: "hard"
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NIVEL 15: Titular, Resumen y Preparación Entrevista
  // ══════════════════════════════════════════════════════════════════════════
  {
    level: 15,
    name: "Titular, Resumen y Entrevista",
    description: "El AI debe crear titulares impactantes, resúmenes concisos y preparar al usuario para entrevistas",
    requiredScore: 85,
    skills: ["headline_creation", "summary_writing", "interview_prep", "value_proposition"],
    scenarios: [
      {
        id: "l15-s1",
        userMessage: "Ayúdame a crear un titular profesional. Soy desarrollador con 5 años de experiencia en fintech, especializado en pagos y Python.",
        expectedBehavior: [
          "Crea titular con keywords relevantes",
          "Incluye años de experiencia",
          "Incluye especialización",
          "Máximo 10-15 palabras",
          "Ejemplo: 'Senior Software Engineer | 5+ años en Fintech & Payments | Python'"
        ],
        failCriteria: [
          "Titular genérico sin keywords",
          "Muy largo (>20 palabras)",
          "No refleja especialización"
        ],
        tags: ["headline_creation", "good_format"],
        difficulty: "medium"
      },
      {
        id: "l15-s2",
        userMessage: "Escribe mi resumen profesional. 8 años desarrollador, lideré equipos de 10 personas, trabajé en banca y fintech, stack: Python, Node.js, AWS. Logro principal: reduje costos operativos 40%.",
        expectedBehavior: [
          "Resumen de 100-150 palabras máximo",
          "Incluye años de experiencia",
          "Menciona industrias (banca, fintech)",
          "Incluye logro cuantificable",
          "Tono profesional pero dinámico"
        ],
        failCriteria: [
          "Resumen muy largo (>200 palabras)",
          "No incluye métricas",
          "Tono aburrido o genérico"
        ],
        tags: ["summary_writing", "concise"],
        difficulty: "medium"
      },
      {
        id: "l15-s3",
        userMessage: "Basándote en mi CV, ¿qué preguntas me haría un recruiter? Quiero prepararme para la entrevista.",
        expectedBehavior: [
          "Genera 5-7 preguntas probables",
          "Incluye preguntas técnicas según el stack",
          "Incluye preguntas sobre logros específicos",
          "Incluye preguntas de fit cultural",
          "Da tips para responder"
        ],
        failCriteria: [
          "Preguntas genéricas no relacionadas al CV",
          "No da tips de preparación",
          "Menos de 3 preguntas"
        ],
        tags: ["interview_prep", "helpful"],
        difficulty: "hard"
      },
      {
        id: "l15-s4",
        userMessage: "Tengo una discapacidad visual. ¿Cómo puedo presentar esto como fortaleza en mi CV?",
        expectedBehavior: [
          "Trato empático y respetuoso",
          "Identifica habilidades desarrolladas: atención al detalle, adaptabilidad, uso de tecnología asistiva",
          "Sugiere cómo redactarlo positivamente",
          "NO minimiza ni exagera",
          "Ofrece opciones de incluir o no según preferencia"
        ],
        failCriteria: [
          "Trato condescendiente",
          "Ignora la pregunta",
          "No ofrece alternativas"
        ],
        tags: ["good_tone", "helpful", "inclusive"],
        difficulty: "hard"
      }
    ]
  }
]

// Helper to get level by number
export function getTrainingLevel(level: number): TrainingLevel | undefined {
  return TRAINING_LEVELS.find(l => l.level === level)
}

// Helper to get all scenarios for a level
export function getLevelScenarios(level: number): TrainingScenario[] {
  const levelData = getTrainingLevel(level)
  return levelData?.scenarios || []
}

// Calculate score for a level based on passed scenarios
export function calculateLevelScore(passedScenarios: number, totalScenarios: number): number {
  return Math.round((passedScenarios / totalScenarios) * 100)
}

// Check if level is passed
export function isLevelPassed(score: number, level: number): boolean {
  const levelData = getTrainingLevel(level)
  return score >= (levelData?.requiredScore || 80)
}
